/**
 * send-scheduled-notifications.cjs
 * Cron job: envia notificaciones push segun las preferencias del usuario.
 * Ejecutar cada minuto desde crontab.
 */
const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');
const prisma = new PrismaClient();

// Configurar VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:contacto@teclingoingles.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function getNow(timezone) {
  // Devuelve la hora actual en la zona del usuario
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
  });
  const parts = formatter.formatToParts(now).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
    dayOfWeek: dayMap[parts.weekday] ?? 0,
    dateKey: parts.year + '-' + parts.month + '-' + parts.day,
  };
}

(async () => {
  try {
    const prefs = await prisma.notificationPreference.findMany({
      where: { enabled: true },
      include: { user: { select: { email: true, name: true } } },
    });

    let sent = 0;
    let skipped = 0;

    for (const pref of prefs) {
      const now = getNow(pref.timezone);

      // Verificar dia de la semana
      if (!pref.daysOfWeek.includes(now.dayOfWeek)) { skipped++; continue; }

      // Verificar hora y minuto (±1 min de tolerancia)
      if (now.hour !== pref.hour || now.minute !== pref.minute) { skipped++; continue; }

      // Verificar que no se haya enviado ya hoy
      if (pref.lastSentAt) {
        const lastKey = pref.lastSentAt.toISOString().split('T')[0];
        if (lastKey === now.dateKey) { skipped++; continue; }
      }

      // Obtener suscripciones del usuario
      const subs = await prisma.pushSubscription.findMany({ where: { userId: pref.userId } });
      if (subs.length === 0) { skipped++; continue; }

      const payload = JSON.stringify({
        title: 'Teclingo - Hora de practicar!',
        body: 'Es momento de tu recordatorio de ingles. Entra y practica 10 minutos.',
        icon: '/icon-192.png',
        url: '/',
      });

      let sentThisUser = false;
      for (const s of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          sentThisUser = true;
        } catch (err) {
          console.warn('[cron] Error enviando a', s.id, err.statusCode);
          // Si la suscripcion es invalida (410), borrarla
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: s.id } });
          }
        }
      }

      if (sentThisUser) {
        await prisma.notificationPreference.update({
          where: { id: pref.id },
          data: { lastSentAt: new Date() },
        });
        sent++;
        console.log('[cron] Enviado a:', pref.user.email);
      }
    }

    console.log('[cron] Resultado: enviados=' + sent + ' omitidos=' + skipped + ' total=' + prefs.length);
    await prisma.$disconnect();
  } catch (error) {
    console.error('[cron] Error fatal:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();

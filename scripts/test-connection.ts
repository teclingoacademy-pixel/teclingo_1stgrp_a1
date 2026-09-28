import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();

function testEndpoint(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function main() {
  console.log('🔌 Verificando conexión directa a BD...');
  const users = await prisma.user.count();
  const lessons = await prisma.lesson.count();
  const exercises = await prisma.exercise.count();
  console.log(`   Users: ${users} | Lessons: ${lessons} | Exercises: ${exercises}`);

  console.log('\n🌐 Verificando API REST...');
  try {
    const lessonsData = await testEndpoint('/api/lessons');
    console.log('   ✅ GET /api/lessons funciona');
    if (lessonsData?.data) {
      console.log(`   📚 ${lessonsData.data.length} lecciones devueltas`);
      lessonsData.data.forEach((l: any) => {
        console.log(`      ${l.id} | ${l.level} | ${l._count?.exercises || 0} ejercicios`);
      });
    }
  } catch (error: any) {
    console.log(`   ⚠️ API no disponible: ${error.message}`);
    console.log('   ℹ️ El servidor no está corriendo. Inícialo con: npm run dev');
  }

  console.log('\n✅ CONEXIÓN A BASE DE DATOS VERIFICADA CORRECTAMENTE');
  await prisma.$disconnect();
}

main().catch(console.error);

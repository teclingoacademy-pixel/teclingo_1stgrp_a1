Dominio: teclingoingles.com gestionado por Cloudflare (nameservers remy y zariyah)

Backend: api.teclingoingles.com → Túnel Cloudflare teclingo-api-tunnel → localhost:3000

Frontend: Vercel → www.teclingoingles.com

DNS del servidor: 1.1.1.1 y 8.8.8.8 (con chattr +i para persistencia)

PM2: pm2 start con --update-env cuando cambies .env




# Ver estado del backend
pm2 list
pm2 logs teclingo-backend --lines 50

# Reiniciar backend con .env actualizado
pm2 restart teclingo-backend --update-env

# Verificar túnel Cloudflare
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 30 --no-pager

# Verificar DNS
dig api.teclingoingles.com @1.1.1.1 +short

# Ver logs del servidor web
sudo journalctl -u nginx -n 20 --no-pager
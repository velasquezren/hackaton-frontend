# ==========================================================
# Dockerfile optimizado para Next.js Standalone en Cloud Run
# ==========================================================

# --- Etapa 1: Instalar dependencias ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiamos descriptores de paquetes
COPY package*.json ./
RUN npm ci

# --- Etapa 2: Compilación y Build estático ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno inyectadas durante la compilación estática de Next.js
# IMPORTANTE: Reemplazamos por la URL real de tu backend activo en la nube
ENV NEXT_PUBLIC_API_URL=https://backend-agritech-698520637534.us-central1.run.app/api
ENV PORT=3000
ENV NODE_ENV=production

# Ejecuta la compilación de Next.js
RUN npm run build

# --- Etapa 3: Entorno mínimo de ejecución ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Creamos un usuario de sistema no privilegiado por razones de seguridad en la nube
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos la carpeta pública estática
COPY --from=builder /app/public ./public

# Ajustamos permisos para la caché interna de Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiamos los archivos de trazado standalone compilados
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Next.js standalone arranca ejecutando el script nativo 'server.js'
CMD ["node", "server.js"]

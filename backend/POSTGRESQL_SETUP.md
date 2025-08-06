# 📋 Instrucciones para PostgreSQL

## 🐘 Instalación de PostgreSQL en Windows

### Opción 1: Instalador Oficial (Recomendado)
1. **Descargar PostgreSQL**: Ve a https://www.postgresql.org/download/windows/
2. **Ejecutar instalador**: Descarga y ejecuta el instalador oficial
3. **Configuración durante la instalación**:
   - Port: 5432 (por defecto)
   - Usuario: postgres
   - Contraseña: postgres (o la que prefieras)
   - Crear base de datos por defecto

### Opción 2: PostgreSQL Portable
1. **Descargar**: Ve a https://get.enterprisedb.com/postgresql
2. **Extraer y configurar** según las instrucciones

### Opción 3: Docker (Avanzado)
```bash
docker run --name postgres-migrania -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=migrania_db -p 5432:5432 -d postgres:15
```

## ⚙️ Configuración para el Proyecto

### Para usar PostgreSQL:
1. **Instalar PostgreSQL** (ver opciones arriba)
2. **Crear la base de datos**:
   ```sql
   CREATE DATABASE migrania_db;
   ```
3. **Modificar `.env`**:
   ```env
   USE_POSTGRESQL=true
   POSTGRES_DB=migrania_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=tu_password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   ```
4. **Instalar dependencias de PostgreSQL**:
   ```bash
   pip install psycopg2-binary
   ```
5. **Ejecutar migraciones**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Para usar SQLite (actual):
- No requiere instalación adicional
- Perfecto para desarrollo
- El archivo `.env` ya está configurado con `USE_POSTGRESQL=false`

## 🚀 Comandos útiles

### Verificar conexión a PostgreSQL:
```bash
psql -h localhost -U postgres -d migrania_db
```

### Comandos de Django:
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver
```

## 🔄 Cambiar entre SQLite y PostgreSQL

### Para cambiar a PostgreSQL:
1. Modificar `.env`: `USE_POSTGRESQL=true`
2. Asegurar que PostgreSQL esté instalado y funcionando
3. Crear la base de datos si no existe
4. Ejecutar migraciones: `python manage.py migrate`

### Para cambiar a SQLite:
1. Modificar `.env`: `USE_POSTGRESQL=false`
2. Ejecutar migraciones: `python manage.py migrate`

## 📝 Estado Actual
- ✅ Configuración flexible implementada
- ✅ SQLite funcionando para desarrollo
- ⏳ PostgreSQL listo para cuando se instale
- ✅ Variables de entorno configuradas

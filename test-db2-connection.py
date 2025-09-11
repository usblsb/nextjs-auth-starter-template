#!/usr/bin/env python3
import psycopg2
import sys
import os
from urllib.parse import urlparse

# Datos de conexión desde .env
DB2_HOST = "ep-noisy-band-ag59xk78-pooler.c-2.eu-central-1.aws.neon.tech"
DB2_PORT = "5432"
DB2_NAME = "neondb"
DB2_USER = "solo_lectura"
DB2_PASSWORD = "npg_nqjJw1N7HZkb"

def test_connection():
    print("🔍 Probando conexión a DB2...")
    print(f"Host: {DB2_HOST}")
    print(f"Port: {DB2_PORT}")
    print(f"Database: {DB2_NAME}")
    print(f"User: {DB2_USER}")
    print("-" * 50)
    
    try:
        # Intentar conexión
        conn = psycopg2.connect(
            host=DB2_HOST,
            port=DB2_PORT,
            database=DB2_NAME,
            user=DB2_USER,
            password=DB2_PASSWORD,
            sslmode='require'
        )
        
        print("✅ Conexión establecida correctamente!")
        
        # Probar query básica
        cursor = conn.cursor()
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        print(f"✅ Query test exitosa: {result}")
        
        # Verificar si existe la tabla diapositivas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%diapositiva%'
        """)
        tables = cursor.fetchall()
        print(f"📋 Tablas encontradas con 'diapositiva': {tables}")
        
        # Si encontramos la tabla, contar registros
        if tables:
            table_name = tables[0][0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"📊 Total de registros en {table_name}: {count}")
            
            # Mostrar algunos registros de ejemplo
            cursor.execute(f"SELECT id, titulo, slug, estado FROM {table_name} LIMIT 5")
            samples = cursor.fetchall()
            print(f"📝 Primeros 5 registros:")
            for sample in samples:
                print(f"  - ID: {sample[0]}, Título: {sample[1]}, Slug: {sample[2]}, Estado: {sample[3]}")
        
        cursor.close()
        conn.close()
        print("✅ Conexión cerrada correctamente")
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except psycopg2.Error as e:
        print(f"❌ Error de PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def ping_host():
    print("\n🏓 Probando ping al host...")
    import subprocess
    try:
        result = subprocess.run(
            ['ping', '-c', '3', DB2_HOST], 
            capture_output=True, 
            text=True, 
            timeout=10
        )
        if result.returncode == 0:
            print("✅ Ping exitoso:")
            print(result.stdout)
        else:
            print("❌ Ping falló:")
            print(result.stderr)
    except subprocess.TimeoutExpired:
        print("❌ Ping timeout - el host no responde")
    except Exception as e:
        print(f"❌ Error en ping: {e}")

if __name__ == "__main__":
    print("🔧 Test de conexión DB2 - Neon PostgreSQL")
    print("=" * 60)
    
    # Primero hacer ping
    ping_host()
    
    print("\n" + "=" * 60)
    
    # Luego probar conexión DB
    success = test_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ¡Conexión DB2 funciona correctamente!")
    else:
        print("💥 Hay problemas con la conexión DB2")
        print("🔧 Posibles soluciones:")
        print("  1. Verificar que el servidor Neon esté activo")
        print("  2. Revisar las credenciales de acceso")
        print("  3. Verificar permisos del usuario 'solo_lectura'")
        print("  4. Comprobar configuración de firewall/VPN")
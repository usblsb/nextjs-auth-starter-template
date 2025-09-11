#!/usr/bin/env python3
import socket
import subprocess
import sys

# Datos de conexión
DB2_HOST = "ep-noisy-band-ag59xk78-pooler.c-2.eu-central-1.aws.neon.tech"
DB2_PORT = 5432

def test_network_connectivity():
    print("🔧 Test de conectividad de red DB2")
    print("=" * 60)
    print(f"Host: {DB2_HOST}")
    print(f"Port: {DB2_PORT}")
    print("-" * 50)
    
    # Test 1: Ping
    print("\n🏓 Test 1: Ping al host...")
    try:
        result = subprocess.run(
            ['ping', '-c', '3', DB2_HOST], 
            capture_output=True, 
            text=True, 
            timeout=15
        )
        if result.returncode == 0:
            print("✅ Ping exitoso - Host alcanzable")
            lines = result.stdout.strip().split('\n')
            for line in lines[-3:]:  # Últimas 3 líneas con estadísticas
                if 'packet loss' in line or 'min/avg/max' in line:
                    print(f"   {line}")
        else:
            print("❌ Ping falló - Host no alcanzable")
            print(f"Error: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("❌ Ping timeout (>15s) - Conectividad muy lenta o bloqueada")
    except Exception as e:
        print(f"❌ Error en ping: {e}")
    
    # Test 2: Test de puerto TCP
    print(f"\n🔌 Test 2: Conectividad TCP puerto {DB2_PORT}...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)  # 10 segundos timeout
        result = sock.connect_ex((DB2_HOST, DB2_PORT))
        sock.close()
        
        if result == 0:
            print(f"✅ Puerto {DB2_PORT} ABIERTO - Servicio PostgreSQL responde")
        else:
            print(f"❌ Puerto {DB2_PORT} CERRADO o FILTRADO - Servicio no alcanzable")
            print(f"Error code: {result}")
    except socket.gaierror as e:
        print(f"❌ Error DNS - No se puede resolver {DB2_HOST}: {e}")
    except Exception as e:
        print(f"❌ Error en test de puerto: {e}")
    
    # Test 3: Traceroute (si está disponible)
    print(f"\n🛣️  Test 3: Traceroute a {DB2_HOST}...")
    try:
        result = subprocess.run(
            ['traceroute', '-m', '10', DB2_HOST], 
            capture_output=True, 
            text=True, 
            timeout=30
        )
        if result.returncode == 0:
            print("✅ Traceroute completado:")
            lines = result.stdout.strip().split('\n')[:6]  # Primeros 6 saltos
            for line in lines:
                if line.strip():
                    print(f"   {line}")
        else:
            print("⚠️  Traceroute no disponible o falló")
    except subprocess.TimeoutExpired:
        print("⚠️  Traceroute timeout - Ruta muy lenta")
    except FileNotFoundError:
        print("⚠️  Comando traceroute no encontrado (normal en algunos sistemas)")
    except Exception as e:
        print(f"⚠️  Error en traceroute: {e}")

def test_dns_resolution():
    print(f"\n🌐 Test 4: Resolución DNS...")
    try:
        import socket
        ip_address = socket.gethostbyname(DB2_HOST)
        print(f"✅ DNS resuelve {DB2_HOST} → {ip_address}")
        
        # Test reverso
        try:
            reverse_name = socket.gethostbyaddr(ip_address)
            print(f"✅ DNS reverso {ip_address} → {reverse_name[0]}")
        except:
            print(f"⚠️  DNS reverso no disponible para {ip_address}")
            
    except Exception as e:
        print(f"❌ Error DNS: {e}")

def test_psql_connection():
    print(f"\n🐘 Test 5: Conexión PostgreSQL (si psql está disponible)...")
    try:
        # Intentar usar psql si está disponible
        connection_string = f"postgresql://solo_lectura:npg_nqjJw1N7HZkb@{DB2_HOST}/neondb?sslmode=require"
        result = subprocess.run(
            ['psql', connection_string, '-c', 'SELECT 1 as test;'], 
            capture_output=True, 
            text=True, 
            timeout=15
        )
        if result.returncode == 0:
            print("✅ Conexión PostgreSQL EXITOSA")
            print(f"Resultado: {result.stdout.strip()}")
        else:
            print("❌ Conexión PostgreSQL FALLÓ")
            print(f"Error: {result.stderr.strip()}")
    except FileNotFoundError:
        print("⚠️  psql no está instalado - No se puede probar conexión DB directa")
    except subprocess.TimeoutExpired:
        print("❌ Timeout en conexión PostgreSQL (>15s)")
    except Exception as e:
        print(f"❌ Error en test psql: {e}")

if __name__ == "__main__":
    test_network_connectivity()
    test_dns_resolution() 
    test_psql_connection()
    
    print("\n" + "=" * 60)
    print("🎯 DIAGNÓSTICO COMPLETADO")
    print("=" * 60)
    print("Si todos los tests pasan ✅ pero Prisma falla:")
    print("  • Problema en configuración de Prisma")
    print("  • Credenciales incorrectas")
    print("  • SSL/TLS mal configurado")
    print("")
    print("Si hay fallos en conectividad ❌:")
    print("  • Servidor Neon caído/mantenimiento")
    print("  • Firewall/proxy bloqueando conexión")
    print("  • Problemas de red local")
<?php
// php/login.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// 🔍 ACTIVAR DEPURACIÓN (solo para pruebas)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 📝 LOG PARA DEPURACIÓN
error_log("=== NUEVO INTENTO DE LOGIN ===");
$input = file_get_contents('php://input');
error_log("📥 Input crudo: " . $input);

$data = json_decode($input, true);
error_log("📦 Datos decodificados: " . print_r($data, true));

try {
    // Incluir conexión
    require_once 'conexion_base_de_datos/conexion.php';
    
    if (!class_exists('Database')) {
        throw new Exception("Clase Database no encontrada");
    }
    
    $db = new Database();
    $pdo = $db->getConnection('login');
    
    // Verificar que llegaron datos
    if (!$data) {
        throw new Exception("No se recibieron datos o JSON inválido");
    }
    
    // Obtener datos
    $no_nomina = isset($data['no_nomina']) ? trim($data['no_nomina']) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';
    $area_id = isset($data['area_id']) ? intval($data['area_id']) : 0;
    $rol_id = isset($data['rol_id']) ? intval($data['rol_id']) : 0;
    
    error_log("👤 Buscando usuario: '$no_nomina'");
    error_log("🏢 Área ID enviada: $area_id");
    error_log("👔 Rol ID enviado: $rol_id");
    
    // Validar datos mínimos
    if (empty($no_nomina)) {
        echo json_encode([
            'success' => false,
            'message' => 'El número de nómina es obligatorio'
        ]);
        exit;
    }
    
    if (empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña es obligatoria'
        ]);
        exit;
    }
    
    // Buscar usuario por número de nómina
    $stmt = $pdo->prepare("
        SELECT 
            ui.*, 
            a.area as area_nombre,
            a.id as area_id,
            r.rol as rol_nombre,
            r.id as rol_id
        FROM usuarios_internos ui
        JOIN areas a ON ui.area_id = a.id
        JOIN roles r ON ui.rol_id = r.id
        WHERE ui.no_nomina = ?
    ");
    
    $stmt->execute([$no_nomina]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) {
        error_log("❌ Usuario no encontrado: $no_nomina");
        echo json_encode([
            'success' => false,
            'message' => 'Usuario no encontrado'
        ]);
        exit;
    }
    
    error_log("✅ Usuario encontrado: " . $usuario['nombre'] . " " . $usuario['apellido_paterno']);
    error_log("🏢 Área REAL del usuario: " . $usuario['area_nombre'] . " (ID: " . $usuario['area_id'] . ")");
    error_log("👔 Rol REAL del usuario: " . $usuario['rol_nombre'] . " (ID: " . $usuario['rol_id'] . ")");
    
    // Verificar contraseña
    if (!$db->verifyPassword($password, $usuario['password'])) {
        error_log("❌ Contraseña incorrecta para: $no_nomina");
        echo json_encode([
            'success' => false,
            'message' => 'Contraseña incorrecta'
        ]);
        exit;
    }
    
    error_log("✅ Contraseña correcta");
    
    // ========== VERIFICACIÓN ESPECIAL ==========
    // Verificar si es el usuario especial (Innovación Tecnológica con rol Representante)
    $area_especial = ($usuario['area_nombre'] == 'INNOVACION_TECNOLOGICA');
    $rol_especial = ($usuario['rol_nombre'] == 'REPRESENTANTE');
    $es_usuario_especial = ($area_especial && $rol_especial);
    
    error_log("🔍 ¿Es usuario especial? " . ($es_usuario_especial ? "SÍ" : "NO"));
    
    if ($es_usuario_especial) {
        // Usuario especial: NO validamos que el área y rol coincidan
        // Solo verificamos que los IDs enviados existan en las tablas correspondientes
        error_log("🎉 Usuario especial - Saltando validación de área y rol original");
        
        // Verificar que el área_id enviado exista en la tabla areas
        $stmtArea = $pdo->prepare("SELECT id, area FROM areas WHERE id = ?");
        $stmtArea->execute([$area_id]);
        $areaSeleccionada = $stmtArea->fetch(PDO::FETCH_ASSOC);
        
        if (!$areaSeleccionada) {
            error_log("❌ Área seleccionada no existe: ID $area_id");
            echo json_encode([
                'success' => false,
                'message' => 'Área seleccionada no válida'
            ]);
            exit;
        }
        
        // Verificar que el rol_id enviado exista en la tabla roles
        $stmtRol = $pdo->prepare("SELECT id, rol FROM roles WHERE id = ?");
        $stmtRol->execute([$rol_id]);
        $rolSeleccionado = $stmtRol->fetch(PDO::FETCH_ASSOC);
        
        if (!$rolSeleccionado) {
            error_log("❌ Rol seleccionado no existe: ID $rol_id");
            echo json_encode([
                'success' => false,
                'message' => 'Rol seleccionado no válido'
            ]);
            exit;
        }
        
        // Usar los datos seleccionados por el usuario para la sesión
        $area_nombre_usuario = $areaSeleccionada['area'];
        $rol_nombre_usuario = $rolSeleccionado['rol'];
        $area_id_usuario = $area_id;
        $rol_id_usuario = $rol_id;
        
        error_log("🎯 Usuario especial - Accediendo como:");
        error_log("   Área seleccionada: $area_nombre_usuario (ID: $area_id_usuario)");
        error_log("   Rol seleccionado: $rol_nombre_usuario (ID: $rol_id_usuario)");
        
    } else {
        // Usuario normal: validamos que el área y rol coincidan con los originales
        error_log("🔒 Usuario normal - Validando área y rol original");
        
        if ($usuario['area_id'] != $area_id || $usuario['rol_id'] != $rol_id) {
            error_log("❌ Error: Área o rol no coinciden con los originales");
            echo json_encode([
                'success' => false,
                'message' => 'Credenciales no válidas'
            ]);
            exit;
        }
        
        $area_nombre_usuario = $usuario['area_nombre'];
        $rol_nombre_usuario = $usuario['rol_nombre'];
        $area_id_usuario = $usuario['area_id'];
        $rol_id_usuario = $usuario['rol_id'];
        
        error_log("✅ Validación exitosa - Accediendo como:");
        error_log("   Área: $area_nombre_usuario");
        error_log("   Rol: $rol_nombre_usuario");
    }
    
    // Verificar si es primer inicio (numero_inicio == 0)
    $es_primer_inicio = ($usuario['numero_inicio'] == 0);
    
    // Preparar datos del usuario (SIN CONTRASEÑA)
    $usuario_session = [
        'id' => $usuario['id'],
        'nombre' => $usuario['nombre'],
        'apellido_paterno' => $usuario['apellido_paterno'],
        'apellido_materno' => $usuario['apellido_materno'],
        'nombre_completo' => $usuario['nombre'] . ' ' . $usuario['apellido_paterno'] . ' ' . $usuario['apellido_materno'],
        'no_nomina' => $usuario['no_nomina'],
        'area_id' => $area_id_usuario,
        'area_nombre' => $area_nombre_usuario,
        'rol_id' => $rol_id_usuario,
        'rol_nombre' => $rol_nombre_usuario,
        'numero_inicio' => $usuario['numero_inicio']
    ];
    
    // Generar token
    $token = bin2hex(random_bytes(16));
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Login exitoso',
        'usuario' => $usuario_session,
        'es_primer_inicio' => $es_primer_inicio,
        'token' => $token
    ]);
    
    error_log("✅ Login exitoso para: $no_nomina");
    
} catch (PDOException $e) {
    error_log("❌ Error PDO: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("❌ Error general: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
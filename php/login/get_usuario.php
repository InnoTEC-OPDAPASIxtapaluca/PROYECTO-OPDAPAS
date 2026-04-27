<?php
// php/get_usuario.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'conexion_base_de_datos/conexion.php';

try {
    $db = new Database();
    $pdo = $db->getConnection('login');
    
    $no_nomina = isset($_GET['nomina']) ? trim($_GET['nomina']) : '';
    
    if (empty($no_nomina)) {
        echo json_encode([
            'success' => false,
            'message' => 'Número de nómina requerido'
        ]);
        exit;
    }
    
    // Buscar usuario por número de nómina
    $stmt = $pdo->prepare("
        SELECT 
            ui.id,
            ui.no_nomina,
            ui.nombre,
            ui.apellido_paterno,
            ui.apellido_materno,
            ui.area_id,
            a.area as area_nombre,
            ui.rol_id,
            r.rol as rol_nombre,
            ui.numero_inicio
        FROM usuarios_internos ui
        JOIN areas a ON ui.area_id = a.id
        JOIN roles r ON ui.rol_id = r.id
        WHERE ui.no_nomina = ?
    ");
    
    $stmt->execute([$no_nomina]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($usuario) {
        echo json_encode([
            'success' => true,
            'usuario' => [
                'id' => $usuario['id'],
                'no_nomina' => $usuario['no_nomina'],
                'nombre_completo' => $usuario['nombre'] . ' ' . $usuario['apellido_paterno'] . ' ' . $usuario['apellido_materno'],
                'area_id' => $usuario['area_id'],
                'area_nombre' => $usuario['area_nombre'],
                'rol_id' => $usuario['rol_id'],
                'rol_nombre' => $usuario['rol_nombre'],
                'numero_inicio' => $usuario['numero_inicio']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Nómina no encontrada'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al buscar usuario: ' . $e->getMessage()
    ]);
}
?>
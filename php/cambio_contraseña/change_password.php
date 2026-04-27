<?php
// php/change_password.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once 'conexion_base_de_datos/conexion.php';

try {
    $db = new Database();
    $pdo = $db->getConnection('login');
    
    // Obtener datos
    $data = json_decode(file_get_contents('php://input'), true);
    
    $no_nomina = isset($data['no_nomina']) ? trim($data['no_nomina']) : '';
    $new_password = isset($data['new_password']) ? trim($data['new_password']) : '';
    
    if (empty($no_nomina) || empty($new_password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Datos incompletos'
        ]);
        exit;
    }
    
    // Validar longitud mínima de 8 caracteres
    if (strlen($new_password) < 8) {
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña debe tener al menos 8 caracteres'
        ]);
        exit;
    }
    
    // Validar que tenga al menos 1 número
    if (!preg_match('/[0-9]/', $new_password)) {
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña debe tener al menos 1 número'
        ]);
        exit;
    }
    
    // Validar que tenga al menos 1 caracter especial
    if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $new_password)) {
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña debe tener al menos 1 caracter especial'
        ]);
        exit;
    }
    
    // Validar que tenga al menos 1 mayúscula
    if (!preg_match('/[A-Z]/', $new_password)) {
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña debe tener al menos 1 letra mayúscula'
        ]);
        exit;
    }
    
    // Encriptar nueva contraseña
    $hashed_password = $db->hashPassword($new_password);
    
    // Actualizar
    $stmt = $pdo->prepare("
        UPDATE usuarios_internos 
        SET password = ?, numero_inicio = 1 
        WHERE no_nomina = ?
    ");
    $result = $stmt->execute([$hashed_password, $no_nomina]);
    
    if ($result && $stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Contraseña actualizada exitosamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo actualizar la contraseña'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al cambiar la contraseña: ' . $e->getMessage()
    ]);
}
?>
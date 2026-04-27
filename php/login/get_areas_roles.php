<?php
// php/get_areas_roles.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'conexion_base_de_datos/conexion.php';

try {
    $db = new Database();
    $pdo = $db->getConnection('login');
    
    // Obtener áreas
    $stmtAreas = $pdo->query("SELECT id, area FROM areas ORDER BY area");
    $areas = $stmtAreas->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener roles
    $stmtRoles = $pdo->query("SELECT id, rol FROM roles ORDER BY rol");
    $roles = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'areas' => $areas,
        'roles' => $roles
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar datos: ' . $e->getMessage()
    ]);
}
?>
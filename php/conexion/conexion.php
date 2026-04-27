<?php
// php/conexion.php
class Database {
    // Configuración de TODAS las bases de datos del proyecto (MySQL)
    private $connections = [
        // Base de datos para el LOGIN
        'login' => [
            'host' => 'localhost',
            'port' => '3306',        // Puerto por defecto de MySQL
            'dbname' => 'login_op',
            'username' => 'root',    // Usuario por defecto de Laragon
            'password' => ''         // Contraseña vacía por defecto en Laragon
        ],
        'innovacion_tecnologica' => [
            'host' => 'localhost',
            'port' => '3306',
            'dbname' => 'innovacion_op',
            'username' => 'root',
            'password' => ''
        ],
        // BASE DE DATOS PARA ATENCIÓN A USUARIOS
        'atencion_usuarios' => [
            'host' => 'localhost',
            'port' => '3306',
            'dbname' => 'atencion_op',
            'username' => 'root',
            'password' => ''
        ],
        'direccion_general' => [
            'host' => 'localhost',
            'port' => '3306',
            'dbname' => 'direccion_op',
            'username' => 'root',
            'password' => ''
        ],
        'user_general' => [
            'host' => 'localhost',
            'port' => '3306',
            'dbname' => 'general_op',
            'username' => 'root',
            'password' => ''
        ],
    ];
    
    private $conn = [];
    
    /**
     * Obtener conexión a una base de datos específica
     */
    public function getConnection($dbKey = 'login') {
        // Si ya existe la conexión, la retornamos
        if (isset($this->conn[$dbKey])) {
            return $this->conn[$dbKey];
        }
        
        // Verificar si la base de datos existe
        if (!isset($this->connections[$dbKey])) {
            throw new Exception("Base de datos '$dbKey' no configurada");
        }
        
        $db = $this->connections[$dbKey];
        
        try {
            // Cadena de conexión para MySQL
            $dsn = "mysql:host=" . $db['host'] . 
                   ";port=" . $db['port'] . 
                   ";dbname=" . $db['dbname'] . 
                   ";charset=utf8mb4";
            
            $conn = new PDO($dsn, $db['username'], $db['password']);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            $this->conn[$dbKey] = $conn;
            return $conn;
            
        } catch(PDOException $e) {
            error_log("Error conectando a $dbKey: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }
    
    /**
     * Encriptar contraseña con Argon2
     */
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 1
        ]);
    }
    
    /**
     * Verificar contraseña con Argon2
     */
    public function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}
?>
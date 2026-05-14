<?php
session_start();

$db = new mysqli("localhost", "root", "");
$db->query("CREATE DATABASE IF NOT EXISTS evergreen_library");
$db->select_db("evergreen_library");

$db->query("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
)");

$db->query("CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_name TEXT,
    total_price DECIMAL(6,2),
    user_name VARCHAR(80)
)");

if ($db->query("SELECT id FROM users WHERE email='levi@gmail.com'")->num_rows == 0) {
    $hash = password_hash("12345678", PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users(username, email, password) VALUES('levi', 'levi@gmail.com', ?)");
    $stmt->bind_param("s", $hash);
    $stmt->execute();
}

header("Content-Type: application/json");

function answer($data) {
    echo json_encode($data);
    exit;
}

function valid_user($username, $email, $password) {
    return strlen($username) >= 3 && filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($password) >= 8;
}

$action = $_POST["action"] ?? $_GET["action"] ?? "";

if ($action == "check") {
    answer(["logged" => isset($_SESSION["user_id"]), "admin" => $_SESSION["admin"] ?? false]);
}

if ($action == "signup" || $action == "login") {
    $username = trim($_POST["username"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $password = $_POST["password"] ?? "";

    if (!valid_user($username, $email, $password)) {
        answer(["ok" => false, "message" => "Use a valid username, email, and 8+ character password."]);
    }

    if ($action == "signup") {
        $stmt = $db->prepare("SELECT id FROM users WHERE username=? OR email=?");
        $stmt->bind_param("ss", $username, $email);
        $stmt->execute();

        if ($stmt->get_result()->num_rows > 0) {
            answer(["ok" => false, "message" => "That username or email already exists."]);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users(username, email, password) VALUES(?,?,?)");
        $stmt->bind_param("sss", $username, $email, $hash);
        $stmt->execute();

        $_SESSION["user_id"] = $db->insert_id;
        $_SESSION["username"] = $username;
        $_SESSION["admin"] = false;
        answer(["ok" => true, "admin" => false, "message" => "Signed in."]);
    }

    $stmt = $db->prepare("SELECT id, username, password FROM users WHERE username=? AND email=?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($password, $user["password"])) {
        answer(["ok" => false, "message" => "Wrong login details."]);
    }

    $_SESSION["user_id"] = $user["id"];
    $_SESSION["username"] = $user["username"];
    $_SESSION["admin"] = $user["username"] == "levi" && $email == "levi@gmail.com";
    answer(["ok" => true, "admin" => $_SESSION["admin"], "message" => "Logged in."]);
}

if ($action == "order") {
    if (!isset($_SESSION["user_id"])) answer(["ok" => false, "message" => "Log in first."]);

    $name = trim($_POST["name"] ?? "");
    $books = trim($_POST["books"] ?? "");
    $total = (float)($_POST["total"] ?? 0);

    if ($name == "" || $books == "" || $total <= 0) {
        answer(["ok" => false, "message" => "Order data is missing."]);
    }

    $stmt = $db->prepare("INSERT INTO orders(book_name, total_price, user_name) VALUES(?,?,?)");
    $stmt->bind_param("sds", $books, $total, $name);
    $stmt->execute();
    answer(["ok" => true, "message" => "Order saved."]);
}

if ($action == "orders") {
    if (!($_SESSION["admin"] ?? false)) {
        http_response_code(403);
        answer(["ok" => false]);
    }

    $orders = [];
    $result = $db->query("SELECT book_name, total_price, user_name FROM orders ORDER BY id DESC");

    while ($row = $result->fetch_assoc()) {
        $orders[] = $row;
    }

    answer(["ok" => true, "orders" => $orders]);
}

answer(["ok" => false, "message" => "Bad request."]);

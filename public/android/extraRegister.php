<?php

if ($_SERVER['REQUEST_METHOD'] =='POST'){

    $email = $_POST['email'];
    $firstname = $_POST['firstname'];
    $surname = $_POST['surname'];
    $password = $_POST['password'];

    $password = password_hash($password, PASSWORD_BCRYPT);
    

    require_once 'extraConnect.php';
    
    $sql = "INSERT INTO patients (email, firstname, surname, password, qrcode, token) VALUES('$email', '$firstname', '$surname', '$password', 'qrcode', 'token')";

    if ( mysqli_query($conn, $sql) ) {
        $result["success"] = 1;
        $result["message"] = "success";

            echo json_encode($result);
            mysqli_close($conn);
    } 
    
    else{
        $result["success"] = 0;
        $result["message"] = "error";

            echo json_encode($result);
            mysqli_close($conn);
    }
}

?>
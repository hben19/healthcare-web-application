<?php

if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    $email = $_POST['email'];
    $password = $_POST['password'];

    require_once 'extraConnect.php';

    $sql = "SELECT * FROM patients 
    JOIN clinicalRecords ON (patients.id=clinicalRecords.patient_id) 
    JOIN address ON (patients.id=address.patient_id) 
    JOIN physicalCondition ON (patients.id=physicalCondition.patient_id)
    WHERE email = '$email' ";

    $response = mysqli_query($conn, $sql);

    $result = array();
    $result['login'] = array();

    if (mysqli_num_rows($response) === 1) {
        $row = mysqli_fetch_assoc($response);
        if( password_verify($password, $row['password']) ) {
            
            //patients
            $index['id'] = $row['id'];
            $index['firstname'] = $row['firstname'];
            $index['surname'] = $row['surname'];
            $index['email'] = $row['email'];
            $index['qrcode'] = $row['qrcode'];
            $index['token'] = $row['token'];

            //clinicalRecords
            $index['medical_condition'] = $row['medical_condition'];
            $index['date_of_birth'] = $row['date_of_birth'];
            $index['gender'] = $row['gender'];
            $index['allergies'] = $row['allergies'];
            $index['prescriptions'] = $row['prescriptions'];
            $index['blood_type'] = $row['blood_type'];
            $index['parent1_id'] = $row['parent1_id'];
            $index['parent2_id'] = $row['parent2_id'];

            //address
            $index['address_line1'] = $row['address_line1'];
            $index['address_line2'] = $row['address_line2'];
            $index['country'] = $row['country'];
            $index['city'] = $row['city'];
            $index['postcode'] = $row['postcode'];

            //physicalCondition
            $index['height'] = $row['height'];
            $index['weight'] = $row['weight'];
            $index['systolic'] = $row['systolic'];
            $index['diastolic'] = $row['diastolic'];
            $index['smoker'] = $row['smoker'];
            
            array_push($result['login'], $index);
            
            $result['success'] = "1";
            $result['message'] = "success";
            echo json_encode($result);

            mysqli_close($conn);
        }

        else{
            $result['success'] = "0";
            $result['message'] = "incorrect pw";
            echo json_encode($result);
            mysqli_close($conn);
        }
    }
    else{
        $result['success'] = "404";
        $result['message'] = "no email";
        echo json_encode($result);
        mysqli_close($conn);
    }
}

?>
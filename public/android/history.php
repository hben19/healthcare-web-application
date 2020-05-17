<?php

if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    $id = $_POST['id'];

    require_once 'extraConnect.php';

    $sql = "SELECT * FROM medicalEvents WHERE patient_id='$id'";

    $response = mysqli_query($conn, $sql);

    $result = array();
    $result['extraDetails'] = array();

    if (mysqli_num_rows($response) === 1) {
        $row = mysqli_fetch_assoc($response);

        // medicalEvents
        $index['event_id'] = $row['event_id'];
        $index['date'] = $row['date'];
        $index['short_description'] = $row['short_description'];
        $index['long_description'] = $row['long_description'];
        $index['doctor_GMC'] = $row['doctor_GMC'];

        array_push($result['history'], $index);

        $result['success'] = "1";
        $result['message'] = "success";
        echo json_encode($result);

        mysqli_close($conn);
    } else {
        $result['success'] = "0";
        $result['message'] = "error";
        echo json_encode($result);
        mysqli_close($conn);
    }
}

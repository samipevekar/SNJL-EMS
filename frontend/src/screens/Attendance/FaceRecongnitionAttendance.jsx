import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../redux/slice/authSlice';
import { markAttendanceWithFace, resetFaceAttendance, selectFaceAttendanceStatus, selectFaceAttendanceLoading, selectFaceAttendanceError } from '../../redux/slice/attendanceSlice';
import colors from '../../theme/colors';

export default function FaceRecognitionAttendance() {
  const [hasPermission, setHasPermission] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const user = useSelector(selectUser);
  const cameraRef = useRef(null);
  const userId = user?.id;
  const devices = useCameraDevices();
  const frontCamera = devices.find((device) => device.position === 'front');
  const dispatch = useDispatch();
  
  // Redux state
  const loading = useSelector(selectFaceAttendanceLoading);
  const status = useSelector(selectFaceAttendanceStatus);
  const error = useSelector(selectFaceAttendanceError);

  useEffect(() => {
    const checkPermissions = async () => {
      const cameraStatus = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
      );
      setHasPermission(cameraStatus === RESULTS.GRANTED);
    };
    checkPermissions();
    
    // Reset face attendance state when component unmounts
    return () => {
      dispatch(resetFaceAttendance());
    };
  }, [dispatch]);

  useEffect(() => {
    if (status) {
      setFaceDetected(true);
      Alert.alert('Success', status.message || 'Attendance marked successfully');
      dispatch(resetFaceAttendance());
    }
    
    if (error) {
      setFaceDetected(false);
      Alert.alert('Error', error.error || error || 'Failed to mark attendance');
      dispatch(resetFaceAttendance());
    }
  }, [status, error, dispatch]);

  const handleAttendance = async () => {
    if (cameraRef.current && frontCamera) {
      try {
        setFaceDetected(false);
        
        const photo = await cameraRef.current.takePhoto();
        console.log('Captured Photo:', photo);

        if (!photo || !photo.path) {
          Alert.alert('Error', 'Failed to capture image. Please try again.');
          return;
        }

        const base64Image = await RNFS.readFile(photo.path, 'base64');
        
        // Dispatch the Redux action
        dispatch(markAttendanceWithFace({
          user_id: userId,
          image: base64Image
        }));

      } catch (error) {
        console.error('Error Capturing Image:', error);
        setFaceDetected(false);
        Alert.alert('Error', 'Something went wrong while capturing the image.');
      }
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.permissionText}>Requesting Camera Permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Face Recognition Attendance</Text>
      
      <View style={styles.content}>
        {frontCamera ? (
          <View style={[
            styles.cameraContainer, 
            faceDetected ? styles.detected : styles.notDetected,
            loading && styles.processing
          ]}>
            <Camera 
              style={styles.camera} 
              device={frontCamera} 
              ref={cameraRef} 
              isActive={true} 
              photo={true} 
            />
            {loading && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.overlayText}>Processing Face Detection</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.errorText}>No front camera found</Text>
        )}

        <TouchableOpacity 
          style={[
            styles.button, 
            loading && styles.buttonDisabled
          ]} 
          onPress={handleAttendance} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Mark Attendance</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  permissionText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6C757D',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    width: '90%',
    aspectRatio: 3/4,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    position: 'relative', // Added for better border positioning
  },
  detected: {
    borderWidth: 4,
    borderColor: '#4BB543',
  },
  notDetected: {
    borderWidth: 4,
    borderColor: '#FF4444',
  },
  processing: {
    borderWidth: 4,
    borderColor: colors.secondary,
  },
  camera: {
    width: '100%',
    height: '100%',
    position: 'absolute', // This ensures the camera fills the container
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    marginBottom: 30,
  },
});
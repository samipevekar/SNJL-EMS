import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import colors  from '../../theme/colors';  // Import theme colors
import { useDispatch, useSelector } from 'react-redux';
import { loginUserAsync, selectLoginUserStatus } from '../../redux/slice/authSlice';
import { CommonActions } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';

const Login = ({navigation}) => {
  const { control, handleSubmit, formState: { errors },reset } = useForm();
  const dispatch = useDispatch()

  const loading = useSelector(selectLoginUserStatus)

  const onSubmit = async(data) => {
    console.log("Login Data:", data);
    try {
      const result = await dispatch(loginUserAsync(data)).unwrap();
      if (result.success) {
        reset();
      }
      // Navigation after successful login
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Main" }],
        })
      );
    } catch (error) {
      Alert.alert("Error", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      <View style={styles.form}>
        
        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email address"
            }
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter Email"
              placeholderTextColor={colors.primary}
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
            />
          )}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters"
            }
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter Password"
              placeholderTextColor={colors.primary}
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        {/* Submit Button */}
        <TouchableOpacity disabled={loading=='loading'}  style={styles.button} onPress={handleSubmit(onSubmit)}>
          <Text  style={styles.buttonText}>{loading=='loading' ? <ActivityIndicator size={'small'} color='white' /> : "Login"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingTop: 80,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    position: 'absolute',
    top: 50,
  },
  form: {
    width: '85%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: colors.white,  // Changed from colors.background to colors.white for contrast
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    color: colors.textDark,  // Using textDark for better readability
    fontSize: 17,
    marginTop: 8,
  },
  inputError: {
    borderColor: colors.danger, // Instead of 'red'
  },
  errorText: {
    color: colors.danger, // Instead of 'red'
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    color: colors.white, // Changed from colors.background to colors.white for contrast
    fontSize: 18,
    fontWeight: 'bold',
  },
});


import React, { useState, useEffect, useRef } from 'react';
import { View, Text, PermissionsAndroid, Platform, StyleSheet, ToastAndroid } from 'react-native';
import Voice from '@react-native-voice/voice';
import AudioRecord from "react-native-audio-record";
import { io, Socket } from "socket.io-client";
import { Buffer } from "buffer"
import * as BackgroundFetch from 'expo-background-fetch';

export default function App() {
  const [recording, setRecording] = useState(false);
  const [detectedWord, setDetectedWord] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket>();

  useEffect(() => {
    requestMicrophonePermission();
    requestFilePermissions();
    AudioRecord.init(options);

    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechError = () => startListening();

    startListening();

    registerBackgroundFetch()

    const host = "http://192.168.1.2:3000";

    console.log(socketRef)
    socketRef.current = io(`${host}`, {
      query: { type: "sender" },
      transports: ["websocket"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    });

    socket.on("connect_error", (error) => {
      console.error("Erro de conex찾o:", error.message);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    });

    AudioRecord.on("data", (data) => {
      let arrayByffer = Buffer.from(data, "base64");
      if (socketRef.current) {
        socketRef.current.emit("audio", arrayByffer);
      }
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  const options = {
    sampleRate: 16000, // default 44100
    channels: 1, // 1 or 2, default 1
    bitsPerSample: 16, // 8 or 16, default 16
    audioSource: 6, // android only (see below)
    wavFile: "test.wav", // default 'audio.wav'
  };

  

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permissão para usar o microfone',
          message: 'Este aplicativo precisa acessar o microfone para reconhecimento de voz.',
          buttonNeutral: 'Perguntar depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        ToastAndroid.show('Permissão negada', ToastAndroid.LONG);
        return false;
      }
    }
    return true;
  };

  const requestFilePermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
  
        if (
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          ToastAndroid.show('Permissões concedidas!', ToastAndroid.LONG);
          return true;
        } else {
          ToastAndroid.show('Permissões negadas!', ToastAndroid.LONG);
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  const handleSpeechResults = (event) => {
    const words = event.value || [];

    console.log(words)
    const normalizedWords = words.map((word) => word.normalize("NFD").replace(/\p{Diacritic}/gu, '').toLowerCase());
    const palavraEncontrada = normalizedWords.find((palavra) => palavra.includes('ola') && palavra.includes('policial'))

    if (palavraEncontrada) {
      console.log('Palavra encontrada!');
      setDetectedWord(palavraEncontrada);
      if (!recording) {
        startAudioRecording();
      }
    } else {
      startListening();
    }
  };

  const startAudioRecording = async () => {
    console.log('Gravação iniciada...');
    try {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (result) {
        AudioRecord.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const onStopRecord = async () => {
    setRecording(false);
    console.log("stop rec");
    const audioFile = await AudioRecord.stop();
    console.log(audioFile);
  };

  const startListening = async () => {
    try {
      await Voice.start('pt-BR');
      console.log('Reconhecimento de voz iniciado...');
    } catch (e) {
      console.error('Erro ao iniciar reconhecimento de voz:', e);
    }
  };

 

  const registerBackgroundFetch = async () => {
    // Registrar a tarefa de BackgroundFetch
    const status = await BackgroundFetch.getStatusAsync();
    if (status !== BackgroundFetch.Status.Restricted && status !== BackgroundFetch.Status.Denied) {
      await BackgroundFetch.registerTaskAsync('background-fetch', {
        minimumInterval: 15 * 60, // 15 minutos
        stopOnTerminate: false, // Continua em segundo plano
        startOnBoot: true, // Inicia após o boot do dispositivo
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text>Microfone Ativo</Text>
      <Text>Última palavra detectada: {detectedWord}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
});

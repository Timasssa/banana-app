import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  Linking, ScrollView, ActivityIndicator, 
  ToastAndroid, Image 
} from 'react-native';
import * as Clipboard from 'expo-clipboard'; // Правильный импорт для Expo
import { io } from 'socket.io-client'; // Правильный импорт сокетов

// Убедись, что в папке проекта есть папка assets, а в ней файл icon.png
const BananaIcon = require('./assets/icon.png'); 

const PC_IP = "192.168.0.6"; 

export default function App() {
  const [receivedText, setReceivedText] = useState('');
  const [hasFile, setHasFile] = useState(false);
  const [status, setStatus] = useState('connecting');
  const socketRef = useRef(null);

  useEffect(() => {
    try {
      // Подключение к серверу
      socketRef.current = io(`http://${PC_IP}:5005`, {
        transports: ['websocket'],
        reconnection: true,
        timeout: 10000,
      });

      socketRef.current.on('connect', () => {
        setStatus('connected');
        ToastAndroid.show("ПК в сети!", ToastAndroid.SHORT);
      });

      socketRef.current.on('connect_error', () => {
        setStatus('error');
      });

      socketRef.current.on('new_data', (data) => {
        setReceivedText(data.message);
        setHasFile(data.has_file);
        ToastAndroid.show("Данные получены!", ToastAndroid.SHORT);
      });

    } catch (e) {
      setStatus('error');
      console.log(e);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const copyToClipboard = async () => {
    if (receivedText) {
      await Clipboard.setStringAsync(receivedText);
      ToastAndroid.show("Текст скопирован", ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.mainBg}>
      {/* Декоративные круги */}
      <View style={[styles.circle, { top: -60, left: -60, width: 280, height: 280 }]} />
      <View style={[styles.circle, { bottom: -120, right: -120, width: 400, height: 400 }]} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: status === 'connected' ? '#40C47E' : '#FF4B2B' }]} />
          <Text style={styles.statusText}>
            {status === 'connected' ? "ПК В СЕТИ" : "ПОИСК ПК..."}
          </Text>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.header}>Banana</Text>
          <View style={styles.iconContainer}>
             <Image source={BananaIcon} style={styles.topIcon} />
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <TouchableOpacity 
            style={styles.textDisplay} 
            onLongPress={copyToClipboard}
            activeOpacity={0.8}
          >
            {receivedText ? (
              <Text style={styles.mainText}>{receivedText}</Text>
            ) : (
              <View style={styles.loaderRow}>
                <ActivityIndicator color="#A0A0A0" size="small" />
                <Text style={styles.placeholder}> * ожидание данных...</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.greenLine} />
        </View>

        <View style={styles.fileArea}>
          <Text style={hasFile ? styles.fileStatusActive : styles.placeholder}>
            {hasFile ? "✓ файл готов" : "* ваши файлы здесь"}
          </Text>
          {hasFile && (
            <TouchableOpacity 
              style={styles.btnDownload} 
              onPress={() => Linking.openURL(`http://${PC_IP}:5005/download`)}
            >
              <Text style={styles.btnDownloadText}>СКАЧАТЬ</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainBg: { flex: 1, backgroundColor: '#F0F9F4' },
  circle: { position: 'absolute', backgroundColor: '#E6F4EA', borderRadius: 1000 },
  container: { padding: 40, paddingTop: 60, alignItems: 'stretch' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20, elevation: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  header: { fontSize: 62, fontWeight: 'bold', color: '#A8E4A0' },
  iconContainer: { width: 80, height: 80, borderRadius: 20, overflow: 'hidden', elevation: 5, backgroundColor: 'white' },
  topIcon: { width: '100%', height: '100%', resizeMode: 'cover' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  textDisplay: { flex: 1, minHeight: 80, backgroundColor: 'white', borderRadius: 33, borderWidth: 2, borderColor: '#A8E4A0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25, elevation: 3 },
  greenLine: { width: 6, height: 50, backgroundColor: '#A8E4A0', borderRadius: 3, marginLeft: 15 },
  placeholder: { color: '#B0B0B0', fontStyle: 'italic', fontSize: 16 },
  loaderRow: { flexDirection: 'row', alignItems: 'center' },
  mainText: { color: '#2C3E50', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
  fileArea: { backgroundColor: 'white', height: 220, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', elevation: 2 },
  fileStatusActive: { color: '#40C47E', fontWeight: 'bold', fontSize: 20, marginBottom: 25 },
  btnDownload: { backgroundColor: '#2C3E50', paddingHorizontal: 50, paddingVertical: 15, borderRadius: 25 },
  btnDownloadText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
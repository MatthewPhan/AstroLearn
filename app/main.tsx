import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  StatusBar,
  Animated
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Index from "./index"; // Import your existing Index component
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRouter } from 'expo-router';

export type RootStackParamList = {
    Splash: undefined;
    Home: undefined;
    StatisticsPage: {
      totalTime: string;
      averageTime: string;
      correctRatio: string;
    };
  };
  

export default function Main() {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Animation references
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  const router = useRouter();
  
  useEffect(() => {
    // Clean sequence of animations
    Animated.stagger(400, [
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const openQuestionModal = () => {
    router.push('/modal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <LinearGradient
        colors={['#1a2a6c', '#4a54c5']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.content}>
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          AstroLearn
        </Animated.Text>
        
        <Animated.View style={{ opacity: buttonOpacity, width: '70%' }}>
          <TouchableOpacity
            style={styles.createDeckButton}
            onPress={openQuestionModal}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Open Question Generator</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Question Generator</Text>
              <View style={{ width: 30 }} />
            </View>
            
            <Index />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: 'white',
    marginBottom: 50,
    letterSpacing: 1,
  },
  createDeckButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 15,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#555',
    fontWeight: '300',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  }
});
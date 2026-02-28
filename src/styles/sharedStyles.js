import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  title: {
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  cameraWrapper: {
    width: '90%',
    height: 160,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  rightControlWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '42%'
  },
  qtyButton: { 
    width: 30, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0, 
    marginHorizontal: 3, 
  },
  inputQty: { 
    color: Colors.light.text,
    width: 45, 
    height: 40, 
    borderWidth: 1, 
    borderColor: Colors.light.border, 
    textAlign: 'center', 
    backgroundColor: Colors.light.surface, 
    borderRadius: 4 
  },
  loader: { 
    position: 'absolute', 
    top: '40%', 
    left: '45%' 
  },
});
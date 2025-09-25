import firestore from '@react-native-firebase/firestore';

const coffeComplaints = firestore().collection('coffeeshopComplaints');

console.log(coffeComplaints, ' complaintsssss --------');
const complaint = await firestore()
  .collection('coffeeshopComplaints')
  .doc('VgoRFCv13Ps4gpF244Nk')
  .get();

console.log(complaint, 'particular complaint --------');

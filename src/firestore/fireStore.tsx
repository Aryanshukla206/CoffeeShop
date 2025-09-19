import firestore from '@react-native-firebase/firestore';


const coffeComplaints = firestore().collection('CoffeeShopComplaints');

console.log(coffeComplaints, " complaintsssss --------")
const complaint = await firestore().collection('CoffeeShopComplaints').doc('VgoRFCv13Ps4gpF244Nk').get();

console.log(complaint, "particular complaint --------")



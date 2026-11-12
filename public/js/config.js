/**
 * MALVITHA Electronics Restoration: settings in one place.
 * The Firebase web config is public by design; what customers may do is decided by firestore.rules.
 */
window.MV_CONFIG = {
  firebase: {
    apiKey: "AIzaSyA0AKGELE1KA3-B850tS5aXe27TiKGnSyo",
    authDomain: "malvitha-restore.firebaseapp.com",
    projectId: "malvitha-restore",
    storageBucket: "malvitha-restore.firebasestorage.app",
    messagingSenderId: "312876003552",
    appId: "1:312876003552:web:bfbe124613d3f35012e085"
  },
  whatsapp: "919493560897",
  adminEmail: "malvithas@gmail.com",
  // device categories: [key saved with the request, label shown]; keys must match firestore.rules
  categories: [
    ["mouse", "Computer Mouse"],
    ["toys", "Electronic Toys"],
    ["robot", "Robot Toys"],
    ["rc", "Remote-Controlled Cars"],
    ["appliance", "Small Appliances"],
    ["pcb", "PCB / Circuit Board"],
    ["gadget", "Electronic Gadgets"],
    ["other", "Other"]
  ],
  // service cards: [category key for "Enquire Now", icon, title, short text, list of common faults]
  services: [
    ["mouse", "ic-mouse", "Computer Mouse Restoration", "Small faults that make a mouse feel useless.", ["Scroll wheel not working", "Left / right button problems", "Connectivity issues", "Other mouse faults"]],
    ["toys", "ic-toy", "Electronic Toys Restoration", "Robot toys, battery toys and toys with circuit problems.", ["Robot toys", "Battery-operated toys", "Circuit problems", "Small motor & wiring faults"]],
    ["rc", "ic-car", "Remote-Controlled Toys", "Toy cars and their remotes brought back on track.", ["Toy cars", "Remote-control issues", "Motor problems", "Battery & circuit troubleshooting"]],
    ["appliance", "ic-kettle", "Small Electronic Appliances", "Small kitchen and household electronic gadgets.", ["Small kitchen gadgets", "Household electronic devices", "Minor circuit faults"]],
    ["pcb", "ic-chip", "PCB & Circuit Board Repair", "Component-level work on the board itself.", ["Component-level troubleshooting", "Damaged connections", "Faulty components"]],
    ["gadget", "ic-gadget", "Electronic Gadgets Restoration", "Small and low-cost imported electronics.", ["Small electronic devices", "Low-cost imported electronics", "Gadgets other shops may not accept"]],
    ["other", "ic-more", "Other Repairable Products", "Not sure if we can help? Send a photo.", ["Send photos for an initial assessment"]]
  ]
};

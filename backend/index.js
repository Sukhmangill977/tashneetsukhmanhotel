// // Import required modules
// const { onRequest, onCall } = require('firebase-functions/v2/https');
// const { defineString } = require('firebase-functions/params');
// const functions = require("firebase-functions");
// const admin = require('firebase-admin');
// const twilio = require('twilio');
// const OpenAI = require('openai');

// // Define environment variables (prompts during deployment or can be set in Firebase console)
// const twilioAccountSid = defineString("TWILIO_ACCOUNT_SID");
// const twilioAuthToken = defineString("TWILIO_AUTH_TOKEN");
// const openaiApiKey = defineString("OPENAI_API_KEY");

// // Initialize Firebase Admin SDK
// admin.initializeApp();
// const db = admin.firestore();

// // Initialize external clients (Twilio, OpenAI)
// let twilioClient;
// let openai;

// function initializeClients() {
//   if (!twilioClient) {
//     twilioClient = twilio(
//       twilioAccountSid.value(),
//       twilioAuthToken.value()
//     );
//   }

//   if (!openai) {
//     openai = new OpenAI({
//       apiKey: openaiApiKey.value()
//     });
//   }
// }

// // Test Endpoint: Basic function to verify deployment
// exports.hotelWelcome = onRequest((req, res) => {
//   res.status(200).send("Hello from the Hotel Management Project!");
// });

// // Old-style (v1) Firebase function just for example (optional, use v2 preferably)
// exports.helloWorld = functions.https.onRequest((req, res) => {
//   res.send("Hello from Hotel Management Project!");
// });



//   async function handleParkingStatus(residentInfo, propertyCompany) {
//     try {
//       console.log(`Checking parking status for resident: ${residentInfo.id}`);
      
//       //get user's active parking passes
//       const now = new Date();
//       const parkingSnapshot = await db.collection('parking')
//         .where('phoneNumber', '==', residentInfo.phone)
//         .where('companyId', '==', propertyCompany.id)
//         .where('status', '==', 'active')
//         .orderBy('createdAt', 'desc')
//         .get();
      
//       console.log(`Found ${parkingSnapshot.docs.length} parking passes for resident`);
      
//       if (parkingSnapshot.empty) {
//         return `Hi ${residentInfo.name}! You don't have any active parking passes right now. Would you like to create a new parking pass?`;
//       }
      
//       //filter passes to only show current/future ones
//       const activePasses = parkingSnapshot.docs
//         .map(doc => ({ id: doc.id, ...doc.data() }))
//         .filter(pass => {
//           const passDate = pass.parkingDate.toDate();
//           const startOfToday = new Date(now);
//           startOfToday.setHours(0, 0, 0, 0);
//           return passDate >= startOfToday;
//         });
      
//       if (activePasses.length === 0) {
//         return `Hi ${residentInfo.name}! You don't have any current or upcoming parking passes. Your previous passes may have expired. Would you like to create a new parking pass?`;
//       }
      
//       //format the active passes
//       const passesList = activePasses.map((pass, index) => {
//         const passDate = pass.parkingDate.toDate();
//         const expiresAt = pass.expiresAt.toDate();
        
//         const dateStr = passDate.toLocaleDateString('en-US', {
//           weekday: 'short',
//           month: 'short', 
//           day: 'numeric'
//         });
        
//         const isToday = passDate.toDateString() === now.toDateString();
//         const isTomorrow = passDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
//         let dateDisplay = dateStr;
//         if (isToday) {
//           dateDisplay = `Today (${dateStr})`;
//         } else if (isTomorrow) {
//           dateDisplay = `Tomorrow (${dateStr})`;
//         }
        
//         // Check if pass is expired
//         const isExpired = now > expiresAt;
//         const statusIndicator = isExpired ? '❌ Expired' : '✅ Active';
        
//         return `${index + 1}. ${statusIndicator}\n   📅 ${dateDisplay}\n   🚗 ${pass.carMake}\n   🏷️ ${pass.licensePlate}\n   🆔 ${pass.id.substring(0, 8)}`;
//       }).join('\n\n');
      
//       const pluralPasses = activePasses.length === 1 ? 'parking pass' : 'parking passes';
      
//       return `Hi ${residentInfo.name}! Here are your ${pluralPasses}:\n\n${passesList}\n\nTo edit a pass, say "edit parking pass" or to create a new one, say "new parking pass".`;
      
//     } catch (error) {
//       console.error('Error checking parking status:', error);
//       return `Sorry ${residentInfo.name}, I'm having trouble checking your parking passes right now. Please try again or contact the front desk.`;
//     }
//   }

//   async function handleParkingEdit(userMessage, residentInfo, propertyCompany) {
//   try {
//     console.log(`Handling parking edit for resident: ${residentInfo.id}`);
//     console.log(`Edit message: "${userMessage}"`);
    
//     // Get conversation state to see if we're already in edit flow
//     const conversationState = await getConversationState(residentInfo.phone, propertyCompany.id);
    
//     // If this is the initial "edit parking pass" request
//     if (userMessage.toLowerCase().includes('edit') && !conversationState.temporaryData?.editMode) {
//       // Get user's current parking passes
//       const now = new Date();
//       const parkingSnapshot = await db.collection('parking')
//         .where('phoneNumber', '==', residentInfo.phone)
//         .where('companyId', '==', propertyCompany.id)
//         .where('status', '==', 'active')
//         .orderBy('createdAt', 'desc')
//         .get();

//       if (parkingSnapshot.empty) {
//         await resetConversationState(conversationState.id);
//         return `Hi ${residentInfo.name}! I don't see any recent parking passes to edit. Would you like to create a new parking pass?`;
//       }

//       // Filter passes to only show current/future ones
//       const activePasses = parkingSnapshot.docs
//         .map(doc => ({ id: doc.id, ...doc.data() }))
//         .filter(pass => {
//           const passDate = pass.parkingDate.toDate();
//           const startOfToday = new Date(now);
//           startOfToday.setHours(0, 0, 0, 0);
//           return passDate >= startOfToday;
//         });

//       if (activePasses.length === 0) {
//         await resetConversationState(conversationState.id);
//         return `Hi ${residentInfo.name}! You don't have any current or upcoming parking passes to edit. Would you like to create a new parking pass?`;
//       }

//       // If only one pass, proceed with editing it
//       if (activePasses.length === 1) {
//         const pass = activePasses[0];
//         const passDate = pass.parkingDate.toDate();
//         const dateStr = passDate.toLocaleDateString('en-US', {
//           weekday: 'short',
//           month: 'short', 
//           day: 'numeric'
//         });

//         // Set up edit mode in conversation state
//         await updateConversationState(conversationState.id, {
//           context: 'parking',
//           flowStep: 'edit_awaiting_changes',
//           temporaryData: {
//             editMode: true,
//             passToEdit: pass.id,
//             currentPlate: pass.licensePlate,
//             currentCar: pass.carMake,
//             passDate: dateStr
//           }
//         });

//         return `Hi ${residentInfo.name}! I can help you edit your parking pass for ${dateStr}. Current details:
// 🏷️ License Plate: ${pass.licensePlate}
// 🚗 Vehicle: ${pass.carMake}

// What would you like to change? You can say something like:
// • "Change license plate to ABC123"
// • "Update car to Honda Civic"  
// • "New plate ABC123 and car Toyota Camry"`;
//       }

//       // Multiple passes - show list and ask which one
//       const passesList = activePasses.map((pass, index) => {
//         const passDate = pass.parkingDate.toDate();
//         const dateStr = passDate.toLocaleDateString('en-US', {
//           weekday: 'short',
//           month: 'short', 
//           day: 'numeric'
//         });
        
//         return `${index + 1}. ${dateStr} - ${pass.carMake} (${pass.licensePlate})`;
//       }).join('\n');

//       await updateConversationState(conversationState.id, {
//         context: 'parking',
//         flowStep: 'edit_selecting_pass',
//         temporaryData: {
//           editMode: true,
//           availablePasses: activePasses
//         }
//       });

//       return `Hi ${residentInfo.name}! You have multiple parking passes. Which one would you like to edit?

// ${passesList}

// Just reply with the number (e.g., "1") or tell me which date.`;
//     }

//     // If we're in edit mode and they're selecting which pass to edit
//     if (conversationState.flowStep === 'edit_selecting_pass') {
//       const availablePasses = conversationState.temporaryData?.availablePasses || [];
      
//       // Try to parse which pass they want to edit
//       let selectedPass = null;
//       const lowerMessage = userMessage.toLowerCase().trim();
      
//       // Check if they said a number
//       const numberMatch = userMessage.match(/^\d+$/);
//       if (numberMatch) {
//         const passIndex = parseInt(numberMatch[0]) - 1;
//         if (passIndex >= 0 && passIndex < availablePasses.length) {
//           selectedPass = availablePasses[passIndex];
//         }
//       }
      
//       // If no number, try to match by date or car info
//       if (!selectedPass) {
//         for (const pass of availablePasses) {
//           const passDate = pass.parkingDate.toDate();
//           const dateStr = passDate.toLocaleDateString('en-US', {
//             weekday: 'short',
//             month: 'short', 
//             day: 'numeric'
//           });
          
//           if (lowerMessage.includes(dateStr.toLowerCase()) ||
//               lowerMessage.includes(pass.licensePlate.toLowerCase()) ||
//               lowerMessage.includes(pass.carMake.toLowerCase())) {
//             selectedPass = pass;
//             break;
//           }
//         }
//       }

//       if (!selectedPass) {
//         return `I couldn't understand which pass you want to edit. Please reply with the number (1, 2, etc.) or tell me the date.`;
//       }

//       // Set up editing for the selected pass
//       const passDate = selectedPass.parkingDate.toDate();
//       const dateStr = passDate.toLocaleDateString('en-US', {
//         weekday: 'short',
//         month: 'short', 
//         day: 'numeric'
//       });

//       await updateConversationState(conversationState.id, {
//         flowStep: 'edit_awaiting_changes',
//         temporaryData: {
//           editMode: true,
//           passToEdit: selectedPass.id,
//           currentPlate: selectedPass.licensePlate,
//           currentCar: selectedPass.carMake,
//           passDate: dateStr
//         }
//       });

//       return `Perfect! Editing your parking pass for ${dateStr}. Current details:
// 🏷️ License Plate: ${selectedPass.licensePlate}
// 🚗 Vehicle: ${selectedPass.carMake}

// What would you like to change? You can say something like:
// • "Change license plate to ABC123"
// • "Update car to Honda Civic"  
// • "New plate ABC123 and car Toyota Camry"`;
//     }

//     // If we're waiting for changes, use OpenAI to understand what they want to change
//     if (conversationState.flowStep === 'edit_awaiting_changes') {
//       const passToEditId = conversationState.temporaryData?.passToEdit;
//       const currentPlate = conversationState.temporaryData?.currentPlate;
//       const currentCar = conversationState.temporaryData?.currentCar;
      
//       if (!passToEditId) {
//         await resetConversationState(conversationState.id);
//         return `Sorry, I lost track of which pass you're editing. Please say "edit parking pass" to start over.`;
//       }

//       // Use OpenAI to understand what they want to change
//       const changes = await parseEditRequestWithAI(userMessage, currentPlate, currentCar);
      
//       if (!changes.newPlate && !changes.newCar) {
//         return `I couldn't understand what you'd like to change. Please be more specific, like:
// • "Change license plate to ABC123"
// • "Update car to Honda Civic"
// • "New plate ABC123 and car Toyota Camry"

// Current details:
// 🏷️ License Plate: ${currentPlate}
// 🚗 Vehicle: ${currentCar}`;
//       }

//       // Apply the changes
//       const updateData = {};
//       if (changes.newPlate) {
//         updateData.licensePlate = changes.newPlate;
//       }
//       if (changes.newCar) {
//         updateData.carMake = changes.newCar;
//       }

//       // Update the parking pass
//       await updateParkingPass(passToEditId, updateData);

//       // Reset conversation state
//       await resetConversationState(conversationState.id);

//       const finalPlate = changes.newPlate || currentPlate;
//       const finalCar = changes.newCar || currentCar;

//       let changeDescription = '';
//       if (changes.newPlate && changes.newCar) {
//         changeDescription = `license plate to ${finalPlate} and vehicle to ${finalCar}`;
//       } else if (changes.newPlate) {
//         changeDescription = `license plate to ${finalPlate}`;
//       } else if (changes.newCar) {
//         changeDescription = `vehicle to ${finalCar}`;
//       }

//       return `Perfect ${residentInfo.name}! I've updated your parking pass ${changeDescription}. 

// Updated details:
// 🏷️ License Plate: ${finalPlate}
// 🚗 Vehicle: ${finalCar}

// The updated pass is ready for pickup at the front desk.`;
//     }

//     // Fallback - shouldn't reach here
//     await resetConversationState(conversationState.id);
//     return `Hi ${residentInfo.name}! I can help you edit your parking pass. Please say "edit parking pass" to get started.`;

//   } catch (error) {
//     console.error('Error handling parking edit:', error);
//     return `Sorry ${residentInfo.name}, I'm having trouble updating your parking pass. Please contact the front desk for assistance.`;
//   }
// }
  
//   // Function to update parking pass
//   async function updateParkingPass(passId, updateData) {
//     try {
//       console.log('Updating parking pass:', passId, updateData);
      
//       const updatePayload = {
//         ...updateData,
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       };
      
//       await db.collection('parking').doc(passId).update(updatePayload);
//       console.log('Parking pass updated successfully');
      
//       return true;
//     } catch (error) {
//       console.error('Error updating parking pass:', error);
//       throw error;
//     }
//   }

//   async function parseEditRequestWithAI(userMessage, currentPlate, currentCar) {
//     try {
//       console.log(`Parsing edit request with OpenAI: "${userMessage}"`);
      
//       const prompt = `You are helping parse a parking pass edit request. The user wants to change their parking pass details.
  
//   Current parking pass details:
//   - License Plate: ${currentPlate}
//   - Vehicle: ${currentCar}
  
//   User's edit request: "${userMessage}"
  
//   Extract what they want to change and respond with JSON only:
//   {
//     "newPlate": "ABC123" or null if not changing,
//     "newCar": "Honda Civic" or null if not changing
//   }
  
//   Rules:
//   - Extract license plates from patterns like "ABC123", "change plate to ABC123", "new plate ABC123"
//   - Extract car info from patterns like "Honda Civic", "Toyota Camry", "update car to BMW"
//   - Be smart about understanding intent - "change it to ABC123" means new plate
//   - Only extract if you're confident - return null if unclear
//   - Format license plates in UPPERCASE
//   - Format car make/model with proper capitalization
  
//   Examples:
//   "Change plate to XYZ789" → {"newPlate": "XYZ789", "newCar": null}
//   "Honda Civic" → {"newPlate": null, "newCar": "Honda Civic"}
//   "New plate ABC123 and car Toyota Camry" → {"newPlate": "ABC123", "newCar": "Toyota Camry"}`;
  
//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {
//             role: 'system',
//             content: 'You are a helpful assistant that extracts parking pass edit information. Always respond with valid JSON only.'
//           },
//           {
//             role: 'user',
//             content: prompt
//           }
//         ],
//         max_tokens: 150,
//         temperature: 0.1,
//       });
  
//       const response = completion.choices[0].message.content.trim();
//       console.log(`OpenAI response: ${response}`);
      
//       try {
//         const parsed = JSON.parse(response);
//         console.log(`Parsed edit request:`, parsed);
//         return parsed;
//       } catch (parseError) {
//         console.error('Error parsing OpenAI JSON response:', parseError);
//         return { newPlate: null, newCar: null };
//       }
  
//     } catch (error) {
//       console.error('Error using OpenAI to parse edit request:', error);
//       return { newPlate: null, newCar: null };
//     }
//   }
  
//   async function handleParkingRequest(userMessage, residentInfo, propertyCompany) {
//     try {
//       console.log(`Handling parking request for: ${residentInfo.isResident ? residentInfo.name : 'non-resident'}`);
      
//       const lowerMessage = userMessage.toLowerCase();
      
//       // Check if they're asking for term/long-term parking
//       const termKeywords = ['term', 'long-term', 'weekly', 'monthly', 'multiple days', 'several days', 'permanent', 'regular'];
//       const isTermRequest = termKeywords.some(keyword => lowerMessage.includes(keyword));
      
//       if (isTermRequest) {
//         const greeting = residentInfo.isResident ? `Hi ${residentInfo.name}!` : "Hi there!";
//         return `${greeting} For term-based or long-term parking arrangements, please visit the front desk in person to complete the setup. They'll help you with weekly, monthly, or extended parking passes that require additional documentation and payment processing.`;
//       }
      
//       // Extract date and car info from the message
//       const dateInfo = extractDateInfo(userMessage);
//       const carInfo = extractCarInfo(userMessage);
      
//       // Check if they provided everything (date, plate, car)
//       if (dateInfo.date && carInfo.licensePlate && carInfo.carMake) {
//         return await createParkingPass(carInfo, dateInfo, residentInfo, propertyCompany);
//       }
      
//       // Check what we're missing and ask accordingly
//       const greeting = residentInfo.isResident ? `Hi ${residentInfo.name}!` : "Hi there!";
      
//       if (!dateInfo.date) {
//         return `${greeting} I'd be happy to help you get a visitor parking pass! Parking passes are issued for single days only. I'll need:\n\n1. What date do you need parking? (e.g., "today", "tomorrow", "July 30")\n2. License plate number\n3. Car make and model\n\nYou can send them together or one at a time.`;
//       } else if (!carInfo.licensePlate && !carInfo.carMake) {
//         const dateStr = dateInfo.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
//         return `Great! I have the date: ${dateStr}. Now I need:\n\n1. Your license plate number\n2. Car make and model (e.g., "Honda Civic")\n\nYou can send them together or separately.`;
//       } else if (carInfo.licensePlate && !carInfo.carMake) {
//         const dateStr = dateInfo.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
//         return `Perfect! I have:\n• Date: ${dateStr}\n• License plate: ${carInfo.licensePlate}\n\nWhat's the make and model of your car?`;
//       } else if (carInfo.carMake && !carInfo.licensePlate) {
//         const dateStr = dateInfo.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
//         return `Great! I have:\n• Date: ${dateStr}\n• Car: ${carInfo.carMake}\n\nWhat's your license plate number?`;
//       }
      
//       return `${greeting} I'd be happy to help you get a visitor parking pass! Parking passes are issued for single days only. Please provide:\n\n1. Date needed (today, tomorrow, or specific date)\n2. License plate number\n3. Car make and model`;
      
//     } catch (error) {
//       console.error('Error handling parking request:', error);
//       const greeting = residentInfo.isResident ? residentInfo.name : "there";
//       return `Sorry ${greeting}, I'm having trouble processing your parking request. Please contact the front desk for assistance.`;
//     }
//   }
  
//   // Function to handle parking follow-up messages
//   async function handleParkingFollowUp(userMessage, conversationHistory, residentInfo, propertyCompany) {
//   // Get conversation state for this call
//   const conversationState = await getConversationState(residentInfo.phone || residentInfo.phoneNumber, propertyCompany.id);
//   return await handleParkingFollowUpImproved(userMessage, conversationHistory, residentInfo, propertyCompany, conversationState);
// }
  
//   // Function to extract date information from message
//   function extractDateInfo(message) {
//     try {
//       const lowerMessage = message.toLowerCase();
//       let date = null;
      
//       const now = new Date();
      
//       // Handle relative dates
//       if (lowerMessage.includes('today')) {
//         date = new Date(now);
//         date.setHours(0, 0, 0, 0); // Start of day
//       } else if (lowerMessage.includes('tomorrow')) {
//         date = new Date(now);
//         date.setDate(date.getDate() + 1);
//         date.setHours(0, 0, 0, 0);
//       } else if (lowerMessage.includes('day after tomorrow')) {
//         date = new Date(now);
//         date.setDate(date.getDate() + 2);
//         date.setHours(0, 0, 0, 0);
//       }
      
//       // Handle specific dates like "July 30", "7/30", "30th"
//       const datePatterns = [
//         /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
//         /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
//         /(\d{1,2})[-.](\d{1,2})[-.](\d{2,4})/,
//         /(\d{1,2})(?:st|nd|rd|th)/
//       ];
      
//       for (const pattern of datePatterns) {
//         const match = message.match(pattern);
//         if (match) {
//           try {
//             if (pattern.toString().includes('january|february')) {
//               // Month name pattern
//               const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
//                                 'july', 'august', 'september', 'october', 'november', 'december'];
//               const monthStr = match[0].toLowerCase().split(/\s+/)[0];
//               const monthIndex = monthNames.indexOf(monthStr);
//               const day = parseInt(match[1]);
              
//               if (monthIndex >= 0 && day >= 1 && day <= 31) {
//                 date = new Date(now.getFullYear(), monthIndex, day);
//                 // If the date has passed this year, assume next year
//                 if (date < now) {
//                   date.setFullYear(now.getFullYear() + 1);
//                 }
//               }
//             } else if (match[2]) {
//               // MM/DD or MM/DD/YY pattern
//               const month = parseInt(match[1]) - 1; // Month is 0-based
//               const day = parseInt(match[2]);
//               let year = now.getFullYear();
              
//               if (match[3]) {
//                 year = parseInt(match[3]);
//                 if (year < 100) year += 2000; // Convert 2-digit year
//               }
              
//               date = new Date(year, month, day);
//             } else {
//               // Day only pattern (like "30th")
//               const day = parseInt(match[1]);
//               date = new Date(now.getFullYear(), now.getMonth(), day);
              
//               // If the date has passed this month, assume next month
//               if (date < now) {
//                 date.setMonth(date.getMonth() + 1);
//               }
//             }
//           } catch (parseError) {
//             console.log('Date parsing error:', parseError);
//           }
//           break;
//         }
//       }
      
//       // Validate date is not too far in the past or future
//       if (date) {
//         const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//         const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
//         if (date < oneWeekAgo || date > oneMonthFromNow) {
//           console.log('Date out of valid range:', date);
//           date = null;
//         }
//       }
      
//       console.log(`Extracted date from "${message}": ${date}`);
//       return { date };
//     } catch (error) {
//       console.error('Error extracting date:', error);
//       return { date: null };
//     }
//   }
  
//   // Function to extract car information from message
//   function extractCarInfo(message) {
//     try {
//       const lowerMessage = message.toLowerCase();
//       let licensePlate = null;
//       let carMake = null;
      
//       // Common license plate patterns
//       const platePatterns = [
//         /([A-Z0-9]{2,8})/gi,  // General alphanumeric pattern
//         /([A-Z]{1,3}[-\s]?[0-9]{2,4})/gi,  // Letter-number combinations
//         /([0-9]{1,3}[-\s]?[A-Z]{2,4})/gi   // Number-letter combinations
//       ];
      
//       // Try to find license plate
//       for (const pattern of platePatterns) {
//         const matches = message.match(pattern);
//         if (matches) {
//           // Filter out obvious non-plate matches (like years, common words)
//           const potentialPlates = matches.filter(match => {
//             const clean = match.replace(/[-\s]/g, '');
//             return clean.length >= 2 && clean.length <= 8 && 
//                    !/^(19|20)\d{2}$/.test(clean) && // Not a year
//                    !/^(the|and|car|for|you|can|get|let|new|old)$/i.test(clean); // Not common words
//           });
          
//           if (potentialPlates.length > 0) {
//             licensePlate = potentialPlates[0].replace(/[-\s]/g, '').toUpperCase();
//             break;
//           }
//         }
//       }
      
//       // Common car makes and models
//       const carBrands = [
//         'honda', 'toyota', 'ford', 'chevrolet', 'chevy', 'nissan', 'hyundai', 
//         'kia', 'subaru', 'mazda', 'volkswagen', 'vw', 'bmw', 'mercedes', 'audi',
//         'lexus', 'acura', 'infiniti', 'volvo', 'tesla', 'jeep', 'ram', 'dodge',
//         'chrysler', 'buick', 'cadillac', 'gmc', 'lincoln', 'mitsubishi', 'suzuki'
//       ];
      
//       const carModels = [
//         'civic', 'accord', 'camry', 'corolla', 'altima', 'sentra', 'elantra',
//         'sonata', 'forte', 'optima', 'outback', 'forester', 'impreza', 'cx-5',
//         'cx-3', 'mazda3', 'mazda6', 'jetta', 'passat', 'golf', 'model', 'models',
//         'f-150', 'silverado', 'ram', 'escape', 'explorer', 'pilot', 'cr-v',
//         'rav4', 'highlander', 'sienna', 'odyssey', 'prius', 'camaro', 'mustang'
//       ];
      
//       // Look for car make/model
//       const words = lowerMessage.split(/\s+/);
//       const carWords = [];
      
//       for (let i = 0; i < words.length; i++) {
//         const word = words[i].replace(/[^a-z0-9]/g, '');
        
//         if (carBrands.includes(word)) {
//           carWords.push(word);
//           // Check if next word is a model
//           if (i + 1 < words.length) {
//             const nextWord = words[i + 1].replace(/[^a-z0-9]/g, '');
//             if (carModels.includes(nextWord) || /^[a-z0-9]{2,}$/.test(nextWord)) {
//               carWords.push(nextWord);
//               i++; // Skip next word since we used it
//             }
//           }
//           break;
//         } else if (carModels.includes(word)) {
//           // Check if previous word was a brand we missed
//           if (i > 0) {
//             const prevWord = words[i - 1].replace(/[^a-z0-9]/g, '');
//             if (carBrands.includes(prevWord)) {
//               carWords.unshift(prevWord);
//             }
//           }
//           carWords.push(word);
//           break;
//         }
//       }
      
//       if (carWords.length > 0) {
//         carMake = carWords.map(word => 
//           word.charAt(0).toUpperCase() + word.slice(1)
//         ).join(' ');
//       }
      
//       console.log(`Extracted car info - Plate: ${licensePlate}, Make: ${carMake}`);
      
//       return { licensePlate, carMake };
//     } catch (error) {
//       console.error('Error extracting car info:', error);
//       return { licensePlate: null, carMake: null };
//     }
//   }
  
//   // Function to create parking pass
//   async function createParkingPass(carInfo, dateInfo, residentInfo, propertyCompany) {
//     try {
//       console.log('Creating parking pass:', { carInfo, dateInfo });
      
//       // Validate the date is not in the past (except for today)
//       const now = new Date();
//       const startOfToday = new Date(now);
//       startOfToday.setHours(0, 0, 0, 0);
      
//       if (dateInfo.date < startOfToday) {
//         const greeting = residentInfo.isResident ? residentInfo.name : 'there';
//         return `Sorry ${greeting}, I can't create a parking pass for a past date. Please choose today or a future date.`;
//       }
      
//       // Set expiration to end of the specified day
//       const expirationDate = new Date(dateInfo.date);
//       expirationDate.setHours(23, 59, 59, 999);
      
//       const parkingData = {
//         licensePlate: carInfo.licensePlate,
//         carMake: carInfo.carMake,
//         phoneNumber: residentInfo.isResident ? residentInfo.phone : residentInfo.phoneNumber,
//         companyId: propertyCompany.id,
//         parkingDate: admin.firestore.Timestamp.fromDate(dateInfo.date),
//         status: 'active',
//         passType: 'daily',
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         issueDate: new Date().toISOString(),
//         expiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
//       };
      
//       // Add resident info if available
//       if (residentInfo.isResident) {
//         parkingData.residentInfo = {
//           id: residentInfo.id,
//           name: residentInfo.name,
//           unitNumber: residentInfo.unitNumber,
//           email: residentInfo.email
//         };
//         parkingData.requestedBy = 'resident';
//       } else {
//         parkingData.requestedBy = 'visitor';
//       }
      
//       console.log('Parking data to be saved:', parkingData);
      
//       const parkingRef = await db.collection('parking').add(parkingData);
//       console.log('Parking pass created successfully with ID:', parkingRef.id);
      
//       const greeting = residentInfo.isResident ? residentInfo.name : 'there';
//       const passId = parkingRef.id.substring(0, 8);
      
//       const dateStr = dateInfo.date.toLocaleDateString('en-US', {
//         weekday: 'long',
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
      
//       // Check if it's for today
//       const isToday = dateInfo.date.toDateString() === now.toDateString();
//       const isTomorrow = dateInfo.date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
      
//       let dateDisplay = dateStr;
//       if (isToday) {
//         dateDisplay = `Today (${dateStr})`;
//       } else if (isTomorrow) {
//         dateDisplay = `Tomorrow (${dateStr})`;
//       }
      
//       return `Perfect ${greeting}! I've created a daily visitor parking pass for:\n\n📅 Date: ${dateDisplay}\n🚗 Vehicle: ${carInfo.carMake}\n🏷️ Plate: ${carInfo.licensePlate}\n⏰ Valid until 11:59 PM\n🆔 Pass ID: ${passId}\n\nWe've notified the concierge. Please go to the front desk to pick up your pass!\n\n*Note: Parking passes are for single days only. For extended parking, visit the front desk.*`;
      
//     } catch (error) {
//       console.error('Error creating parking pass:', error);
//       console.error('Error details:', error.stack);
      
//       const greeting = residentInfo.isResident ? residentInfo.name : 'there';
//       return `Sorry ${greeting}, I encountered an error while creating your parking pass. Please contact the front desk for assistance. Error: ${error.message}`;
//     }
//   }

// // Function to get or create conversation state
// async function getConversationState(phoneNumber, companyId) {
//     try {
//       const stateSnapshot = await db.collection('conversationStates')
//         .where('phoneNumber', '==', phoneNumber)
//         .where('companyId', '==', companyId)
//         .limit(1)
//         .get();
  
//       if (!stateSnapshot.empty) {
//         const stateDoc = stateSnapshot.docs[0];
//         const state = { id: stateDoc.id, ...stateDoc.data() };
        
//         // Check if conversation has expired (30 minutes of inactivity)
//         const now = new Date();
//         const lastActivity = state.lastActivity ? state.lastActivity.toDate() : new Date(0);
//         const minutesSinceActivity = (now - lastActivity) / (1000 * 60);
        
//         if (minutesSinceActivity > 30) {
//           console.log('Conversation expired due to inactivity, creating fresh state');
//           await resetConversationState(state.id);
//           return {
//             id: state.id,
//             phoneNumber,
//             companyId,
//             context: 'general',
//             flowStep: null,
//             temporaryData: {},
//             isActive: true
//           };
//         }
        
//         return state;
//       } else {
//         // Create new state
//         return await createNewConversationState(phoneNumber, companyId);
//       }
//     } catch (error) {
//       console.error('Error getting conversation state:', error);
//       // Return a basic state object so conversation can continue
//       return {
//         phoneNumber,
//         companyId,
//         context: 'general',
//         flowStep: null,
//         temporaryData: {},
//         isActive: true
//       };
//     }
//   }
  
//   // Function to create new conversation state
//   async function createNewConversationState(phoneNumber, companyId) {
//     try {
//       const newState = {
//         phoneNumber,
//         companyId,
//         context: 'general', // general, booking, parking, maintenance, etc.
//         flowStep: null, // tracks current step in multi-step flows
//         temporaryData: {}, // stores partial data during flows
//         isActive: true,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         lastActivity: admin.firestore.FieldValue.serverTimestamp()
//       };
  
//       const stateRef = await db.collection('conversationStates').add(newState);
//       return { id: stateRef.id, ...newState };
//     } catch (error) {
//       console.error('Error creating conversation state:', error);
//       return {
//         phoneNumber,
//         companyId,
//         context: 'general',
//         flowStep: null,
//         temporaryData: {},
//         isActive: true
//       };
//     }
//   }
  
//   // Function to update conversation state
//   async function updateConversationState(stateId, updates) {
//     try {
//       if (!stateId) {
//         console.log('No state ID provided, skipping update');
//         return;
//       }
  
//       const updateData = {
//         ...updates,
//         lastActivity: admin.firestore.FieldValue.serverTimestamp()
//       };
  
//       await db.collection('conversationStates').doc(stateId).update(updateData);
//       console.log('Conversation state updated:', stateId, updates);
//     } catch (error) {
//       console.error('Error updating conversation state:', error);
//     }
//   }
  
//   // Function to reset conversation state
//   async function resetConversationState(stateId) {
//     try {
//       if (!stateId) {
//         console.log('No state ID provided for reset');
//         return;
//       }
  
//       const resetData = {
//         context: 'general',
//         flowStep: null,
//         temporaryData: {},
//         lastActivity: admin.firestore.FieldValue.serverTimestamp()
//       };
  
//       await db.collection('conversationStates').doc(stateId).update(resetData);
//       console.log('Conversation state reset successfully:', stateId);
      
//     } catch (error) {
//       console.error('Error resetting conversation state:', error);
//       // If reset fails, the next message will create a fresh state anyway
//     }
//   }
  
//   // Function to detect conversation end triggers
//   function detectConversationEnd(message) {
//     const lowerMessage = message.toLowerCase().trim();
    
//     // Direct end commands
//     const endTriggers = [
//       'thanks', 'thank you', 'thx', 'ty',
//       'done', 'finished', 'complete', 'all set',
//       'goodbye', 'bye', 'ttyl', 'see you',
//       'that\'s it', 'that\'s all', 'nothing else',
//       'perfect', 'great', 'awesome', 'sounds good',
//       'ok got it', 'understood', 'will do'
//     ];
  
//     // Acknowledgment patterns
//     const acknowledgmentPatterns = [
//       /^(ok|okay|alright|got it|thanks?|perfect|great|awesome)!?$/,
//       /^(will do|sounds good|thank you|ty|thx)!?$/,
//       /^(done|finished|all set|that\'s it|that\'s all)!?$/
//     ];
  
//     // Check for exact matches first
//     if (endTriggers.includes(lowerMessage)) {
//       return true;
//     }
  
//     // Check for patterns
//     return acknowledgmentPatterns.some(pattern => pattern.test(lowerMessage));
//   }
  
//   // Function to detect if message starts a new topic
//   function detectNewTopic(message, currentContext) {
//     const lowerMessage = message.toLowerCase();
    
//     // Topic keywords
//     const topicKeywords = {
//       parking: ['parking', 'park', 'visitor parking', 'parking pass'],
//       booking: ['book', 'reserve', 'schedule', 'party room', 'gym', 'pool', 'amenity'],
//       maintenance: ['broken', 'fix', 'repair', 'maintenance', 'not working', 'issue'],
//       package: ['package', 'delivery', 'mail', 'courier'],
//       visitor: ['visitor', 'guest', 'access', 'buzz'],
//       complaint: ['complaint', 'noise', 'disturb', 'complain']
//     };
  
//     // Check if message contains keywords for a different topic than current context
//     for (const [topic, keywords] of Object.entries(topicKeywords)) {
//       if (topic !== currentContext && keywords.some(keyword => lowerMessage.includes(keyword))) {
//         return topic;
//       }
//     }
  
//     return null;
//   }

//   async function handleBookingStatus(userMessage, residentInfo, propertyCompany) {
//     try {
//       console.log(`Checking booking status for resident: ${residentInfo.id}`);
      
//       // Get user's current bookings from database
//       const now = new Date();
//       const bookingsSnapshot = await db.collection('bookings')
//         .where('residentId', '==', residentInfo.id)
//         .where('companyId', '==', propertyCompany.id)
//         .where('status', 'in', ['pending', 'confirmed'])
//         .orderBy('startDate', 'asc')
//         .get();
      
//       console.log(`Found ${bookingsSnapshot.docs.length} bookings for resident`);
      
//       if (bookingsSnapshot.empty) {
//         return `Hi ${residentInfo.name}! You don't have any current bookings. Would you like to make a new booking?`;
//       }
      
//       const userBookings = bookingsSnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
      
//       // Filter to current and future bookings
//       const activeFutureBookings = userBookings.filter(booking => {
//         const endDate = booking.endDate.toDate();
//         return endDate >= now; // Include current and future bookings
//       });
      
//       if (activeFutureBookings.length === 0) {
//         return `Hi ${residentInfo.name}! You don't have any current or upcoming bookings. Your previous bookings may have ended. Would you like to make a new booking?`;
//       }
      
//       // Format the bookings
//       const bookingsList = activeFutureBookings.map((booking, index) => {
//         const startDate = booking.startDate.toDate();
//         const endDate = booking.endDate.toDate();
        
//         const dateStr = startDate.toLocaleDateString('en-US', {
//           weekday: 'short',
//           month: 'short', 
//           day: 'numeric'
//         });
        
//         const startTimeStr = startDate.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         const endTimeStr = endDate.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         const isToday = startDate.toDateString() === now.toDateString();
//         const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
//         let dateDisplay = dateStr;
//         if (isToday) {
//           dateDisplay = `Today (${dateStr})`;
//         } else if (isTomorrow) {
//           dateDisplay = `Tomorrow (${dateStr})`;
//         }
        
//         // Get amenity name
//         const amenityName = booking.amenityName || booking.title || 'Unknown Amenity';
        
//         return `${index + 1}. 🎉 ${amenityName}\n   📅 ${dateDisplay}\n   ⏰ ${startTimeStr} - ${endTimeStr}\n   📋 ${booking.status}\n   🆔 ${booking.id.substring(0, 8)}`;
//       }).join('\n\n');
      
//       const pluralBookings = activeFutureBookings.length === 1 ? 'booking' : 'bookings';
      
//       return `Hi ${residentInfo.name}! Here are your current and upcoming ${pluralBookings}:\n\n${bookingsList}\n\nTo make a new booking, say "book [amenity name]" or to edit/cancel a booking, say "edit booking".`;
      
//     } catch (error) {
//       console.error('Error checking booking status:', error);
//       console.error('Error details:', error.stack);
//       return `Sorry ${residentInfo.name}, I'm having trouble checking your bookings right now. Please try again or contact the front desk. Error: ${error.message}`;
//     }
//   }
  
//   // Helper function to format bookings list
//   function formatBookingsList(bookings, propertyCompany) {
//     return bookings.map((booking, index) => {
//       const startDate = booking.startDate.toDate();
//       const endDate = booking.endDate.toDate();
      
//       // Format date
//       const now = new Date();
//       const isToday = startDate.toDateString() === now.toDateString();
//       const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
      
//       let dateStr;
//       if (isToday) {
//         dateStr = 'Today';
//       } else if (isTomorrow) {
//         dateStr = 'Tomorrow';
//       } else {
//         dateStr = startDate.toLocaleDateString('en-US', {
//           weekday: 'short',
//           month: 'short',
//           day: 'numeric'
//         });
//       }
      
//       const fullDateStr = startDate.toLocaleDateString('en-US', {
//         weekday: 'short',
//         month: 'short',
//         day: 'numeric'
//       });
      
//       // Format time
//       const startTime = startDate.toLocaleTimeString('en-US', {
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       });
      
//       const endTime = endDate.toLocaleTimeString('en-US', {
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       });
      
//       // Find amenity details
//       const amenity = propertyCompany.amenities.find(a => a.id === booking.amenityId);
//       const amenityName = amenity ? amenity.name : booking.amenityId;
      
//       // Get emoji for amenity type
//       let emoji = '📅';
//       if (amenity) {
//         const type = amenity.type.toLowerCase();
//         if (type.includes('party')) emoji = '🎉';
//         else if (type.includes('pool') || type.includes('swim')) emoji = '🏊‍♂️';
//         else if (type.includes('bbq') || type.includes('grill')) emoji = '🍔';
//         else if (type.includes('gym') || type.includes('fitness')) emoji = '🏋️‍♂️';
//         else if (type.includes('meeting') || type.includes('conference')) emoji = '👥';
//       }
      
//       return `${index + 1}. ${emoji} ${amenityName}\n   📅 Date: ${dateStr} (${fullDateStr})\n   ⏰ Time: ${startTime} - ${endTime}\n   📋 Status: ${booking.status}`;
//     }).join('\n\n');
//   }
//   // Twilio webhook handler for incoming SMS
//   exports.handleIncomingSMS = onRequest(
//     {
//       cors: true
//     },
//     async (req, res) => {
//       try {
//         // Initialize clients
//         initializeClients();
        
//         // Parse Twilio webhook data
//         const { From: phoneNumber, Body: messageBody, MessageSid, To: twilioNumber } = req.body;
        
//         // Clean phone number (remove +1 if present)
//         const cleanPhoneNumber = phoneNumber.replace(/^\+1/, '').replace(/^\+/, '');
//         const cleanTwilioNumber = twilioNumber.replace(/^\+1/, '');
        
//         console.log(`Raw phone numbers - From: ${phoneNumber}, To: ${twilioNumber}`);
//         console.log(`Cleaned phone numbers - From: ${cleanPhoneNumber}, To: ${cleanTwilioNumber}`);
//         console.log(`Incoming message from ${cleanPhoneNumber} to ${cleanTwilioNumber}: ${messageBody}`);
        
//         // Find which property company this Twilio number belongs to
//         const propertyCompany = await getPropertyCompanyByPhone(twilioNumber);
        
//         if (!propertyCompany) {
//           console.error(`No property company found for Twilio number: ${twilioNumber}`);
//           res.status(404).send('Property not found');
//           return;
//         }
        
//         // Store incoming message in database
//         await storeMessage(cleanPhoneNumber, messageBody, 'incoming', MessageSid, propertyCompany.id);
        
//         // Check if sender is a resident of this property
//         const residentInfo = await checkResident(cleanPhoneNumber, propertyCompany.id);
        
//         // Get conversation history
//         const conversationHistory = await getConversationHistory(cleanPhoneNumber, propertyCompany.id);
        
//         // Generate AI response with improved state management
//         const aiResponse = await generateAIResponseWithImprovedState(
//           messageBody,
//           conversationHistory,
//           residentInfo,
//           propertyCompany
//         );
        
//         // Store outgoing message in database
//         await storeMessage(cleanPhoneNumber, aiResponse, 'outgoing', null, propertyCompany.id);
        
//         // Send response via Twilio
//         await sendTwilioResponse(phoneNumber, aiResponse, twilioNumber);
        
//         // Respond to Twilio webhook
//         res.status(200).send('Message processed successfully');
        
//       } catch (error) {
//         console.error('Error processing incoming SMS:', error);
//         res.status(500).send('Internal server error');
//       }
//     }
//   );
  
//   // Function to find property company by phone number
//   async function getPropertyCompanyByPhone(phoneNumber) {
//     try {
//       const companiesSnapshot = await db.collection('propertyCompanies')
//         .where('companyPhone', '==', phoneNumber)
//         .limit(1)
//         .get();
      
//       if (!companiesSnapshot.empty) {
//         const companyDoc = companiesSnapshot.docs[0];
//         return {
//           id: companyDoc.id,
//           ...companyDoc.data()
//         };
//       }
      
//       return null;
//     } catch (error) {
//       console.error('Error finding property company:', error);
//       return null;
//     }
//   }
  
//   // Function to check if phone number belongs to a resident
//   async function checkResident(phoneNumber, companyId) {
//     try {
//       console.log(`Checking resident for phone: ${phoneNumber}, company: ${companyId}`);
      
//       // Try multiple phone number formats
//       const phoneFormats = [
//         phoneNumber,              // e.g., "6478027505"
//         `+1${phoneNumber}`,       // e.g., "+16478027505" 
//         `+${phoneNumber}`,        // e.g., "+6478027505"
//         phoneNumber.replace(/^\+1/, ''), // Remove +1 if present
//         phoneNumber.replace(/^\+/, '')   // Remove + if present
//       ];
      
//       console.log('Trying phone formats:', phoneFormats);
      
//       for (const format of phoneFormats) {
//         console.log(`Searching for phone format: ${format}`);
        
//         const residentsSnapshot = await db.collection('residents')
//           .where('phone', '==', format)
//           .where('companyId', '==', companyId)
//           .limit(1)
//           .get();
        
//         if (!residentsSnapshot.empty) {
//           const residentDoc = residentsSnapshot.docs[0];
//           const residentData = {
//             isResident: true,
//             id: residentDoc.id,
//             ...residentDoc.data()
//           };
//           console.log(`Found resident with format ${format}:`, residentData);
//           return residentData;
//         }
//       }
      
//       console.log('No resident found for any phone number format');
//       return { isResident: false };
//     } catch (error) {
//       console.error('Error checking resident status:', error);
//       return { isResident: false };
//     }
//   }

//   // Enhanced conversation analysis with better context understanding
//   async function analyzeMessageWithImprovedContext(message, residentInfo, propertyCompany, conversationHistory = [], conversationState) {
//     try {
//       const lowerMessage = message.toLowerCase().trim();
      
//       console.log(`Analyzing message: "${message}" with context: ${conversationState.context}, step: ${conversationState.flowStep}`);
      
//       // Get recent conversation history to understand context
//       const recentMessages = conversationHistory.slice(-6);
//       const conversationContext = recentMessages.map(msg => `${msg.direction}: "${msg.content}"`).join('\n');
      
//       console.log('Recent conversation context:', conversationContext);
      
//       // FIRST: Check if we're in an ACTIVE conversation flow and should continue it
//       if (conversationState.context && conversationState.context !== 'general' && conversationState.flowStep) {
//         console.log('In active flow, checking for continuation');
        
//         // Booking flow continuation
//         if (conversationState.context === 'booking') {
//           // If we're waiting for amenity selection
//           if (conversationState.flowStep === 'awaiting_amenity') {
//             // Check if message contains amenity selection (number or name)
//             const numberMatch = message.match(/^\d+$/);
//             if (numberMatch) {
//               const amenityIndex = parseInt(numberMatch[0]) - 1;
//               if (amenityIndex >= 0 && amenityIndex < propertyCompany.amenities.length) {
//                 return { isBookingRequest: true, flowContinuation: true };
//               }
//             }
            
//             // Check for amenity name
//             const amenity = propertyCompany.amenities.find(a => 
//               lowerMessage.includes(a.name.toLowerCase()) || 
//               lowerMessage.includes(a.type.toLowerCase())
//             );
//             if (amenity) {
//               console.log('User selected amenity in booking flow, continuing...');
//               return { isBookingRequest: true, flowContinuation: true };
//             }
//           }
          
//           // If we're waiting for date/time
//           if (conversationState.flowStep === 'awaiting_datetime') {
//             const timeInfo = parseTimeRange(message);
//             if (timeInfo.startTime || lowerMessage.includes('today') || lowerMessage.includes('tomorrow') || 
//                 lowerMessage.includes('pm') || lowerMessage.includes('am')) {
//               console.log('User provided time in booking flow, continuing...');
//               return { isBookingRequest: true, flowContinuation: true };
//             }
//           }
          
//           // If we're waiting for end time
//           if (conversationState.flowStep === 'awaiting_endtime') {
//             const timeInfo = parseTimeRange(message);
//             if (timeInfo.endTime || lowerMessage.includes('pm') || lowerMessage.includes('am') || 
//                 lowerMessage.includes('hour') || lowerMessage.includes('until')) {
//               console.log('User provided end time in booking flow, continuing...');
//               return { isBookingRequest: true, flowContinuation: true };
//             }
//           }
//         }
        
//         // Parking flow continuation
//         if (conversationState.context === 'parking') {
//           // Check if in edit flow
//           if (conversationState.flowStep?.includes('edit')) {
//             return { isParkingEdit: true, flowContinuation: true };
//           }
          
//           // Check if providing parking information
//           if (conversationState.flowStep === 'awaiting_date' ||
//               conversationState.flowStep === 'awaiting_plate' ||
//               conversationState.flowStep === 'awaiting_car_info') {
            
//             const dateInfo = extractDateInfo(message);
//             const carInfo = extractCarInfo(message);
            
//             if (dateInfo.date || carInfo.licensePlate || carInfo.carMake) {
//               return { isParkingFollowUp: true, flowContinuation: true };
//             }
//           }
//         }
//       }
      
//       // SECOND: Check for conversation end triggers
//       const negativeResponses = ['no', 'nope', 'cancel', 'nevermind', 'stop', 'quit', 'exit'];
//       const conversationEndTriggers = ['thanks', 'thank you', 'thx', 'ty', 'done', 'finished', 'bye', 'goodbye', 'perfect', 'great'];
      
//       // Negative responses
//       if (negativeResponses.includes(lowerMessage)) {
//         console.log('Detected negative response, resetting conversation');
//         await resetConversationState(conversationState.id);
//         return { 
//           isNegativeResponse: true,
//           message: `No problem ${residentInfo.name}! Let me know if you need anything else.`
//         };
//       }
      
//       // Conversation end (only for short, standalone responses)
//       const isStandaloneThankYou = conversationEndTriggers.some(trigger => {
//         const cleanMessage = lowerMessage.replace(/[!.?]/g, '').trim();
//         return cleanMessage === trigger || 
//                (cleanMessage.split(' ').length <= 3 && cleanMessage.includes(trigger));
//       });
      
//       if (isStandaloneThankYou && conversationState.context !== 'general') {
//         console.log('Detected standalone thank you, ending conversation');
//         await resetConversationState(conversationState.id);
//         return { 
//           isConversationEnd: true,
//           message: `You're welcome ${residentInfo.name}! Feel free to reach out anytime if you need anything else. Have a great day! 😊`
//         };
//       }
      
//       // THIRD: Check for NEW conversation starters (these should ALWAYS work regardless of state)
      
//       // Status requests - should ALWAYS work regardless of state
//       const parkingStatusKeywords = [
//         'show parking', 'list parking', 'my parking', 'current parking', 'parking passes',
//         'what passes', 'my passes', 'active passes', 'parking status'
//       ];
      
//       const isParkingStatusRequest = parkingStatusKeywords.some(keyword => 
//         lowerMessage.includes(keyword)) || 
//         (lowerMessage.includes('what') && lowerMessage.includes('parking')) ||
//         (lowerMessage.includes('parking') && (lowerMessage.includes('do i') || lowerMessage.includes('any') || lowerMessage.includes('my')));
      
//       if (isParkingStatusRequest) {
//         console.log('Detected parking status request - starting fresh');
//         await updateConversationState(conversationState.id, { 
//           context: 'parking', 
//           flowStep: 'status_check',
//           temporaryData: {}
//         });
//         return { isParkingStatus: true };
//       }
      
//       // Booking status requests - should ALWAYS work
//       const bookingStatusKeywords = [
//         'my bookings', 'my booking', 'show booking', 'list booking', 'current booking',
//         'what booking', 'any booking', 'have booking', 'booking status', 'show my bookings'
//       ];
      
//       const isBookingStatusRequest = bookingStatusKeywords.some(keyword => 
//         lowerMessage.includes(keyword)
//       ) || (lowerMessage.includes('booking') && 
//            (lowerMessage.includes('do i') || lowerMessage.includes('what') || 
//             lowerMessage.includes('show') || lowerMessage.includes('list'))) ||
//          (lowerMessage.includes('bbq') && (lowerMessage.includes('tomorrow') || lowerMessage.includes('today'))) ||
//          (lowerMessage.includes('what do i have') && (lowerMessage.includes('booking') || lowerMessage.includes('booked')));
      
//       if (isBookingStatusRequest) {
//         console.log('Detected booking status request - starting fresh');
//         await updateConversationState(conversationState.id, { 
//           context: 'booking', 
//           flowStep: 'status_check',
//           temporaryData: {}
//         });
//         return { isBookingStatus: true };
//       }
      
//       // Edit requests - should ALWAYS work and override active flows
//       const editKeywords = ['edit', 'change', 'update', 'modify', 'fix', 'correct'];
      
//       const isParkingEditRequest = editKeywords.some(keyword => lowerMessage.includes(keyword)) && 
//                                   (lowerMessage.includes('parking') || lowerMessage.includes('pass'));
      
//       if (isParkingEditRequest) {
//         console.log('Detected parking edit request - starting fresh edit flow');
//         await updateConversationState(conversationState.id, { 
//           context: 'parking', 
//           flowStep: 'edit_request',
//           temporaryData: {}
//         });
//         return { isParkingEdit: true };
//       }
      
//       const isBookingEditRequest = editKeywords.some(keyword => lowerMessage.includes(keyword)) && 
//                                   lowerMessage.includes('booking');
      
//       if (isBookingEditRequest) {
//         console.log('Detected booking edit request - starting fresh edit flow');
//         await updateConversationState(conversationState.id, { 
//           context: 'booking', 
//           flowStep: 'management_request',
//           temporaryData: {}
//         });
//         return { isBookingManagement: true };
//       }
      
//       // New parking requests
//       const parkingKeywords = ['parking', 'park', 'visitor parking', 'parking pass', 'guest parking'];
//       const newParkingIndicators = ['need', 'want', 'get', 'create', 'new', 'book', 'request'];
      
//       const isNewParkingRequest = parkingKeywords.some(keyword => lowerMessage.includes(keyword)) &&
//                                  (newParkingIndicators.some(indicator => lowerMessage.includes(indicator)) ||
//                                   !lowerMessage.includes('do i') && !lowerMessage.includes('my') && !lowerMessage.includes('show'));
      
//       if (isNewParkingRequest) {
//         console.log('Detected NEW parking request - starting fresh parking conversation');
//         await updateConversationState(conversationState.id, { 
//           context: 'parking', 
//           flowStep: 'new_request',
//           temporaryData: {}
//         });
//         return { isParkingRequest: true };
//       }
      
//       // New booking requests
//       const bookingKeywords = ['want to book', 'book a', 'book the', 'reserve a', 'schedule a', 'can i book'];
//       const amenityKeywords = ['party room', 'gym', 'pool', 'bbq', 'fitness', 'meeting room'];
//       const explicitBookingPhrases = ['book', 'reserve', 'schedule'];
      
//       const isExplicitNewBookingRequest = bookingKeywords.some(keyword => lowerMessage.includes(keyword)) ||
//                                          (amenityKeywords.some(keyword => lowerMessage.includes(keyword)) && 
//                                           explicitBookingPhrases.some(phrase => lowerMessage.includes(phrase))) ||
//                                          (lowerMessage.includes('i want') && amenityKeywords.some(keyword => lowerMessage.includes(keyword)));
      
//       if (isExplicitNewBookingRequest) {
//         console.log('Detected EXPLICIT new booking request - starting fresh booking conversation');
//         await updateConversationState(conversationState.id, { 
//           context: 'booking', 
//           flowStep: 'new_request',
//           temporaryData: {}
//         });
//         return { isBookingRequest: true };
//       }
      
//       // FOURTH: Maintenance/issue reporting
//       const maintenanceKeywords = [
//         'broken', 'not working', 'fix', 'repair', 'maintenance', 'issue', 'problem', 
//         'leak', 'leaking', 'clogged', 'electrical', 'plumbing', 'hvac', 'heating', 
//         'cooling', 'light', 'bulb', 'flickering', 'outlet', 'faucet', 'toilet', 
//         'sink', 'shower', 'door', 'window', 'lock', 'buzzer', 'intercom', 'elevator'
//       ];

//       const isMaintenanceIssue = maintenanceKeywords.some(keyword => lowerMessage.includes(keyword)) ||
//                           (lowerMessage.includes('something wrong') || lowerMessage.includes('not right') || 
//                            lowerMessage.includes('help with') && (lowerMessage.includes('my') || lowerMessage.includes('the')));

      
//       // If we get here and no specific pattern matched, treat as general message
//       console.log('No specific pattern detected, treating as general message');
//       await updateConversationState(conversationState.id, { 
//         context: 'general', 
//         flowStep: null,
//         temporaryData: {}
//       });
      
//       return { isGeneralMessage: true };
      
//     } catch (error) {
//       console.error('Error analyzing message with improved context:', error);
//       console.error('Error stack:', error.stack);
      
//       // On error, reset to general state
//       try {
//         await resetConversationState(conversationState.id);
//       } catch (resetError) {
//         console.error('Error resetting conversation state:', resetError);
//       }
      
//       return { 
//         isGeneralMessage: true,
//         error: true 
//       };
//     }
//   }

//   async function handleGeneralMessage(userMessage, conversationHistory, residentInfo, propertyCompany, conversationState) {
//     try {
//       // Build conversation context for OpenAI
//       const recentHistory = conversationHistory.slice(-6);
//       const conversationContext = recentHistory.map(msg => 
//         `${msg.direction === 'incoming' ? 'User' : 'Assistant'}: "${msg.content}"`
//       ).join('\n');
      
//       const systemPrompt = buildSystemPromptWithContext(residentInfo, propertyCompany, conversationContext);
      
//       const messages = [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userMessage }
//       ];
      
//       console.log('Sending to OpenAI for general response');
      
//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo',
//         messages: messages,
//         max_tokens: 300,
//         temperature: 0.7,
//       });
      
//       return completion.choices[0].message.content.trim();
      
//     } catch (error) {
//       console.error('Error handling general message:', error);
//       const greeting = residentInfo.isResident ? residentInfo.name : 'there';
      
//       // Fallback response
//       return `Hi ${greeting}! I'm Claro, your virtual concierge. I can help you with:\n\n• Maintenance issues\n• Visitor parking passes\n• Amenity bookings${residentInfo.isResident ? '\n• Check your current bookings/passes' : ''}\n\nFor other questions, please contact the front desk. What can I help you with?`;
//     }
//   }
  
//   async function handleBookingContextMessage(message, conversationState, residentInfo) {
//     const lowerMessage = message.toLowerCase().trim();
    
//     console.log(`Handling booking context message: "${message}", step: ${conversationState.flowStep}`);
    
//     // If we're in booking management flow and this looks like booking selection
//     if (conversationState.flowStep === 'management_request') {
//       // Check if this contains booking selection info (numbers, amenity names, etc.)
//       const numberMatch = message.match(/^\d+$/);
//       if (numberMatch || lowerMessage.includes('party') || lowerMessage.includes('bbq') || lowerMessage.includes('pool')) {
//         return { isBookingManagement: true };
//       }
//     }
    
//     // If we're in new booking flow, check what we're waiting for
//     if (conversationState.flowStep === 'new_request') {
//       const timeInfo = parseTimeRange(message);
//       const amenityMentioned = lowerMessage.includes('party') || lowerMessage.includes('bbq') || lowerMessage.includes('pool') || lowerMessage.includes('gym');
      
//       if (timeInfo.startTime || amenityMentioned) {
//         return { isBookingRequest: true };
//       }
//     }
    
//     // Default to general handling if we can't determine intent
//     return { isGeneralMessage: true };
//   }
  
//   // Enhanced parking context handler
//   async function handleParkingContextMessage(message, conversationState, residentInfo) {
//     const lowerMessage = message.toLowerCase().trim();
    
//     console.log(`Handling parking context message: "${message}", step: ${conversationState.flowStep}`);
    
//     // If we're in edit flow and this looks like car info, handle as edit
//     if (conversationState.flowStep === 'edit_request') {
//       const carInfo = extractCarInfo(message);
//       if (carInfo.licensePlate || carInfo.carMake) {
//         return { isParkingEdit: true };
//       }
//     }
    
//     // If we're in new request flow, check what we're waiting for
//     if (conversationState.flowStep === 'new_request' || 
//         conversationState.flowStep === 'awaiting_date' ||
//         conversationState.flowStep === 'awaiting_plate' ||
//         conversationState.flowStep === 'awaiting_car_info') {
      
//       // Check if this contains parking info
//       const dateInfo = extractDateInfo(message);
//       const carInfo = extractCarInfo(message);
      
//       if (dateInfo.date || carInfo.licensePlate || carInfo.carMake) {
//         return { isParkingFollowUp: true };
//       }
//     }
    
//     // Default to general handling if we can't determine intent
//     return { isGeneralMessage: true };
//   }
  
//   // Enhanced car info extraction with better filtering
//   function extractCarInfoImproved(message) {
//     try {
//       const lowerMessage = message.toLowerCase();
//       let licensePlate = null;
//       let carMake = null;
      
//       console.log(`Extracting car info from: "${message}"`);
      
//       // Words to exclude from plate detection
//       const excludeWords = [
//         'hi', 'hey', 'hello', 'yo', 'sup', 'ok', 'yes', 'no', 'and', 'the', 'for', 
//         'you', 'can', 'get', 'let', 'new', 'old', 'need', 'want', 'have', 'what',
//         'when', 'where', 'how', 'edit', 'change', 'update', 'fix', 'correct',
//         'tomorrow', 'today', 'yesterday', 'next', 'this', 'that', 'pass', 'parking'
//       ];
      
//       // Enhanced license plate patterns with better validation
//       const platePatterns = [
//         /\b([A-Z]{2,4}[-\s]?[0-9]{2,4})\b/gi,  // Letters followed by numbers
//         /\b([0-9]{1,3}[-\s]?[A-Z]{2,4})\b/gi,  // Numbers followed by letters
//         /\b([A-Z0-9]{4,8})\b/gi  // Mixed alphanumeric (4-8 chars)
//       ];
      
//       // Try to find license plate
//       for (const pattern of platePatterns) {
//         const matches = message.match(pattern);
//         if (matches) {
//           const potentialPlates = matches.filter(match => {
//             const clean = match.replace(/[-\s]/g, '').toLowerCase();
//             return clean.length >= 4 && clean.length <= 8 && 
//                    !/^(19|20)\d{2}$/.test(clean) && // Not a year
//                    !excludeWords.includes(clean) && // Not a common word
//                    /[0-9]/.test(clean) && // Contains at least one number
//                    /[a-z]/i.test(clean) && // Contains at least one letter
//                    !/^(need|want|have|what|when|where|edit|list|show)$/i.test(clean); // Not command words
//           });
          
//           if (potentialPlates.length > 0) {
//             licensePlate = potentialPlates[0].replace(/[-\s]/g, '').toUpperCase();
//             console.log(`Found license plate: ${licensePlate}`);
//             break;
//           }
//         }
//       }
      
//       // Enhanced car make/model detection
//       const carBrands = [
//         'honda', 'toyota', 'ford', 'chevrolet', 'chevy', 'nissan', 'hyundai', 
//         'kia', 'subaru', 'mazda', 'volkswagen', 'vw', 'bmw', 'mercedes', 'audi',
//         'lexus', 'acura', 'infiniti', 'volvo', 'tesla', 'jeep', 'ram', 'dodge',
//         'chrysler', 'buick', 'cadillac', 'gmc', 'lincoln', 'mitsubishi', 'suzuki'
//       ];
      
//       const carModels = [
//         'civic', 'accord', 'camry', 'corolla', 'altima', 'sentra', 'elantra',
//         'sonata', 'forte', 'optima', 'outback', 'forester', 'impreza', 'cx-5',
//         'cx-3', 'mazda3', 'mazda6', 'jetta', 'passat', 'golf', 'model', 'models',
//         'f-150', 'silverado', 'ram', 'escape', 'explorer', 'pilot', 'cr-v',
//         'rav4', 'rav-4', 'highlander', 'sienna', 'odyssey', 'prius', 'camaro', 'mustang'
//       ];
      
//       // Look for car make/model with better context awareness
//       const words = lowerMessage.split(/\s+/);
//       const carWords = [];
      
//       for (let i = 0; i < words.length; i++) {
//         const word = words[i].replace(/[^a-z0-9-]/g, '');
        
//         if (carBrands.includes(word)) {
//           carWords.push(word);
//           // Check if next word is a model
//           if (i + 1 < words.length) {
//             const nextWord = words[i + 1].replace(/[^a-z0-9-]/g, '');
//             if (carModels.includes(nextWord) || /^[a-z0-9-]{2,}$/.test(nextWord)) {
//               carWords.push(nextWord);
//               i++; // Skip next word since we used it
//             }
//           }
//           break;
//         } else if (carModels.includes(word)) {
//           // Check if previous word was a brand
//           if (i > 0) {
//             const prevWord = words[i - 1].replace(/[^a-z0-9-]/g, '');
//             if (carBrands.includes(prevWord)) {
//               carWords.unshift(prevWord);
//             }
//           }
//           carWords.push(word);
//           break;
//         }
//       }
      
//       if (carWords.length > 0) {
//         carMake = carWords.map(word => 
//           word.charAt(0).toUpperCase() + word.slice(1).replace(/-/g, ' ')
//         ).join(' ');
//         console.log(`Found car make: ${carMake}`);
//       }
      
//       console.log(`Extraction result - Plate: ${licensePlate}, Make: ${carMake}`);
//       return { licensePlate, carMake };
//     } catch (error) {
//       console.error('Error extracting car info:', error);
//       return { licensePlate: null, carMake: null };
//     }
//   }

//   async function generateAIResponseWithImprovedState(userMessage, conversationHistory, residentInfo, propertyCompany) {
//     try {
//       console.log(`\n=== PROCESSING MESSAGE ===`);
//       console.log(`Message: "${userMessage}"`);
//       console.log(`Resident: ${residentInfo.isResident ? residentInfo.name : 'non-resident'}`);
      
//       // Get fresh conversation state
//       const conversationState = await getConversationState(residentInfo.phone || residentInfo.phoneNumber, propertyCompany.id);
//       console.log(`Current conversation state:`, conversationState);
      
//       // Analyze the message with full context
//       const analysis = await analyzeMessageWithImprovedContext(userMessage, residentInfo, propertyCompany, conversationHistory, conversationState);
      
//       console.log(`Analysis result:`, analysis);
//       console.log(`=========================\n`);
      
//       // Validate analysis result
//       if (!analysis || typeof analysis !== 'object') {
//         console.error('Analysis returned invalid result, falling back to general handling');
//         await updateConversationState(conversationState.id, { 
//           context: 'general', 
//           flowStep: null,
//           temporaryData: {}
//         });
//         return await handleGeneralMessage(userMessage, conversationHistory, residentInfo, propertyCompany, conversationState);
//       }
      
//       // Handle conversation management responses
//       if (analysis.isNegativeResponse || analysis.isConversationEnd) {
//         console.log('Handling conversation end/negative response');
//         return analysis.message;
//       }
      
//       // Handle maintenance issues
//       if (analysis.isMaintenanceIssue) {
//         console.log('Handling maintenance issue');
//         return await handleMaintenanceIssue(userMessage, residentInfo, propertyCompany);
//       }
      
//       // Handle parking requests and status - ALWAYS AVAILABLE
//       if (analysis.isParkingStatus && residentInfo.isResident) {
//         console.log('Handling parking status request');
//         return await handleParkingStatus(residentInfo, propertyCompany);
//       }
      
//       if (analysis.isParkingEdit && residentInfo.isResident) {
//         console.log('Handling parking edit request');
//         return await handleParkingEdit(userMessage, residentInfo, propertyCompany);
//       }
      
//       if (analysis.isParkingRequest) {
//         console.log('Handling parking request');
//         const response = await handleParkingRequest(userMessage, residentInfo, propertyCompany);
        
//         // Update flow step based on what's missing
//         const carInfo = extractCarInfo(userMessage);
//         const dateInfo = extractDateInfo(userMessage);
        
//         if (!dateInfo.date) {
//           await updateConversationState(conversationState.id, { flowStep: 'awaiting_date' });
//         } else if (!carInfo.licensePlate) {
//           await updateConversationState(conversationState.id, { flowStep: 'awaiting_plate' });
//         } else if (!carInfo.carMake) {
//           await updateConversationState(conversationState.id, { flowStep: 'awaiting_car_info' });
//         }
        
//         return response;
//       }
      
//       if (analysis.isParkingFollowUp) {
//         console.log('Handling parking follow-up');
//         const response = await handleParkingFollowUpImproved(userMessage, conversationHistory, residentInfo, propertyCompany, conversationState);
        
//         // Check if parking pass was created successfully to reset state
//         if (response.includes('created a daily visitor parking pass') || response.includes('Your daily visitor parking pass is ready')) {
//           await resetConversationState(conversationState.id);
//         }
        
//         return response;
//       }
      
//       // Handle booking requests and status - ALWAYS AVAILABLE
//       if (analysis.isBookingStatus && residentInfo.isResident) {
//         console.log('Handling booking status request');
//         return await handleBookingStatus(userMessage, residentInfo, propertyCompany);
//       }
      
//       if (analysis.isBookingManagement && residentInfo.isResident) {
//         console.log('Handling booking management request');
//         return await handleBookingManagement(userMessage, residentInfo, propertyCompany);
//       }
      
//       if (analysis.isBookingRequest) {
//         console.log('Handling booking request');
//         if (residentInfo.isResident) {
//           const response = await handleBookingRequestWithState(userMessage, residentInfo, propertyCompany, conversationState);
          
//           // Reset state if booking was successfully created
//           if (response.includes('booked the') || response.includes('Perfect') && response.includes('booking is confirmed')) {
//             await resetConversationState(conversationState.id);
//           }
          
//           return response;
//         } else {
//           return "Hi there! I'd love to help, but amenity bookings are only available for registered residents. Please visit the front desk in person or ask a resident with their phone number on file to make the booking for you.";
//         }
//       }
      
//       // Handle general messages
//       console.log('Handling as general message');
//       return await handleGeneralMessage(userMessage, conversationHistory, residentInfo, propertyCompany, conversationState);
      
//     } catch (error) {
//       console.error('Error generating AI response with improved state:', error);
//       console.error('Error stack:', error.stack);
      
//       // Try to reset conversation state on error
//       try {
//         const conversationState = await getConversationState(residentInfo.phone || residentInfo.phoneNumber, propertyCompany.id);
//         await resetConversationState(conversationState.id);
//       } catch (resetError) {
//         console.error('Error resetting state after main error:', resetError);
//       }
      
//       return "I'm sorry, I'm having trouble processing your request right now. Please try again or contact the front desk directly.";
//     }
//   }

//   async function handleMaintenanceIssue(message, residentInfo, propertyCompany) {
//     try {
//       console.log('Creating maintenance issue for:', residentInfo.isResident ? residentInfo.name : 'non-resident');
      
//       const issueData = {
//         description: message,
//         phoneNumber: residentInfo.isResident ? residentInfo.phone : residentInfo.phoneNumber,
//         companyId: propertyCompany.id,
//         status: 'open',
//         priority: 'normal',
//         category: 'maintenance',
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         reportedBy: residentInfo.isResident ? 'resident' : 'visitor',
//         // Fix: Use regular Date objects in arrays, not FieldValue.serverTimestamp()
//         messages: [
//           {
//             timestamp: new Date(),
//             sender: 'system',
//             message: `Issue reported via SMS: "${message}"`,
//             type: 'incoming'
//           }
//         ]
//       };
      
//       if (residentInfo.isResident) {
//         issueData.residentId = residentInfo.id;
//         issueData.unitNumber = residentInfo.unitNumber;
//         issueData.title = `Maintenance Issue - Unit ${residentInfo.unitNumber}`;
//         issueData.contactInfo = {
//           name: residentInfo.name,
//           phone: residentInfo.phone,
//           email: residentInfo.email || ''
//         };
//       } else {
//         issueData.title = `Maintenance Issue - Non-resident`;
//         issueData.contactInfo = {
//           phone: residentInfo.phoneNumber
//         };
//       }
      
//       console.log('Issue data to be saved:', issueData);
      
//       const issueRef = await db.collection('issues').add(issueData);
//       console.log('Created maintenance issue successfully:', issueRef.id);
      
//       const greeting = residentInfo.isResident ? residentInfo.name : "there";
//       return `Thanks for reporting this ${greeting}! I've logged your maintenance request and notified the superintendent and management team. Someone will get back to you shortly to address this issue.\n\nIssue ID: ${issueRef.id.substring(0, 8)}`;
      
//     } catch (error) {
//       console.error('Error handling maintenance issue:', error);
//       console.error('Error details:', error.stack);
      
//       const greeting = residentInfo.isResident ? residentInfo.name : "there";
//       return `Sorry ${greeting}, I had trouble logging your maintenance request. Please call the front desk directly at ${propertyCompany.phone || 'the main number'}.`;
//     }
//   }
  
//   async function handleBookingRequestWithState(userMessage, residentInfo, propertyCompany, conversationState) {
//     try {
//       console.log('Handling booking request with state:', userMessage);
//       console.log('Current conversation state:', conversationState);
      
//       const lowerMessage = userMessage.toLowerCase();
      
//       // Get temporary data from previous steps
//       let selectedAmenity = conversationState.temporaryData?.selectedAmenity || null;
//       let startTime = conversationState.temporaryData?.startTime || null;
//       let endTime = conversationState.temporaryData?.endTime || null;
//       let bookingDate = conversationState.temporaryData?.bookingDate || null;
      
//       // Extract amenity from current message if we don't have one
//       if (!selectedAmenity) {
//         for (const amenity of propertyCompany.amenities) {
//           if (lowerMessage.includes(amenity.name.toLowerCase()) || 
//               lowerMessage.includes(amenity.type.toLowerCase())) {
//             selectedAmenity = amenity;
//             console.log('Found amenity:', amenity.name);
//             break;
//           }
//         }
//       }
      
//       // Extract time information if we don't have it
//       if (!startTime || !endTime) {
//         const timeInfo = parseTimeRange(userMessage);
//         if (timeInfo.startTime) {
//           startTime = timeInfo.startTime;
//           bookingDate = timeInfo.startTime; // The date is embedded in the time
//         }
//         if (timeInfo.endTime) {
//           endTime = timeInfo.endTime;
//         }
//       }
      
//       // Update temporary data
//       await updateConversationState(conversationState.id, {
//         temporaryData: {
//           selectedAmenity,
//           startTime,
//           endTime,
//           bookingDate,
//           ...conversationState.temporaryData
//         }
//       });
      
//       // Check what we need to ask for
//       if (!selectedAmenity) {
//         const amenityList = propertyCompany.amenities
//           .map((a, index) => `${index + 1}. ${a.name}`)
//           .join('\n');
        
//         await updateConversationState(conversationState.id, {
//           flowStep: 'awaiting_amenity'
//         });
        
//         return `Hi ${residentInfo.name}! I'd be happy to help you book an amenity. Here are the available options:\n\n${amenityList}\n\nWhich one would you like to book? You can reply with the number or name.`;
//       }
      
//       if (!startTime) {
//         await updateConversationState(conversationState.id, {
//           flowStep: 'awaiting_datetime'
//         });
        
//         return `Great! I can help you book the ${selectedAmenity.name}. What date and time would you prefer?\n\nExamples:\n• "Today at 3pm"\n• "Tomorrow 6-8pm"\n• "Friday 2-4pm"`;
//       }
      
//       if (!endTime) {
//         const startTimeStr = startTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         await updateConversationState(conversationState.id, {
//           flowStep: 'awaiting_endtime'
//         });
        
//         return `Perfect! I have the ${selectedAmenity.name} starting at ${startTimeStr}. What end time would you like?\n\nExamples:\n• "Until 8pm"\n• "For 2 hours"\n• "End at 5pm"`;
//       }
      
//       // We have everything, proceed with booking
//       return await createBookingWithAvailabilityCheck(selectedAmenity, startTime, endTime, residentInfo, propertyCompany, conversationState);
      
//     } catch (error) {
//       console.error('Error handling booking request with state:', error);
//       await resetConversationState(conversationState.id);
//       return `I'm sorry ${residentInfo.name}, there was an issue processing your booking request. Please try again or contact the front desk for assistance.`;
//     }
//   }
  
//   // Helper function to create booking with availability check
//   async function createBookingWithAvailabilityCheck(amenity, startTime, endTime, residentInfo, propertyCompany, conversationState) {
//     try {
//       console.log('Creating booking with availability check:', {
//         amenityId: amenity.id,
//         amenityName: amenity.name,
//         startTime: startTime.toISOString(),
//         endTime: endTime.toISOString()
//       });
      
//       // Check availability
//       const availabilityResult = await checkAmenityAvailability(
//         amenity.id,
//         startTime,
//         endTime,
//         propertyCompany.id
//       );
      
//       console.log('Availability result:', availabilityResult);
      
//       if (!availabilityResult.available) {
//         if (availabilityResult.reason === 'outside_business_hours') {
//           return `Sorry ${residentInfo.name}, the ${amenity.name} is only available during business hours: ${availabilityResult.businessHours}. Would you like to try a different time?`;
//         } else if (availabilityResult.reason === 'already_booked') {
//           const conflictTimes = availabilityResult.conflictingSlots.map(slot => {
//             const start = slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             const end = slot.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             return `${start} - ${end}`;
//           }).join(', ');
          
//           return `Sorry ${residentInfo.name}, the ${amenity.name} is already booked during that time. Current bookings: ${conflictTimes}. Would you like to try a different time?`;
//         } else {
//           return `Sorry ${residentInfo.name}, I'm having trouble checking availability right now. Please try again or contact the front desk.`;
//         }
//       }
      
//       // Create the booking
//       console.log('Attempting to create booking...');
      
//       try {
//         const bookingData = {
//           amenityId: amenity.id,
//           amenityName: amenity.name,
//           companyId: propertyCompany.id,
//           title: `${amenity.name} - ${residentInfo.name}`,
//           startDate: admin.firestore.Timestamp.fromDate(startTime),
//           endDate: admin.firestore.Timestamp.fromDate(endTime),
//           status: 'confirmed',
//           residentId: residentInfo.id,
//           notes: `Booked via SMS by ${residentInfo.name}`,
//           contactInfo: {
//             name: residentInfo.name,
//             phone: residentInfo.phone,
//             email: residentInfo.email || ''
//           },
//           createdAt: admin.firestore.FieldValue.serverTimestamp(),
//           updatedAt: admin.firestore.FieldValue.serverTimestamp()
//         };
        
//         console.log('Booking data to be saved:', bookingData);
        
//         const bookingRef = await db.collection('bookings').add(bookingData);
//         console.log('Booking created successfully with ID:', bookingRef.id);
        
//         // Reset conversation state
//         await resetConversationState(conversationState.id);
        
//         const formatDate = startTime.toLocaleDateString('en-US', {
//           weekday: 'long',
//           year: 'numeric',
//           month: 'long',
//           day: 'numeric'
//         });
        
//         const formatStartTime = startTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         const formatEndTime = endTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         return `Perfect ${residentInfo.name}! I've booked the ${amenity.name} for you:\n\n📅 ${formatDate}\n⏰ ${formatStartTime} - ${formatEndTime}\n🆔 Booking ID: ${bookingRef.id.substring(0, 8)}\n\nYour booking is confirmed! To view or manage your bookings anytime, just say "my bookings".`;
        
//       } catch (bookingError) {
//         console.error('Failed to create booking:', bookingError);
//         await resetConversationState(conversationState.id);
//         return `Sorry ${residentInfo.name}, I encountered an error while creating your booking. Please try again or contact the front desk for assistance. Error: ${bookingError.message}`;
//       }
      
//     } catch (error) {
//       console.error('Error in createBookingWithAvailabilityCheck:', error);
//       await resetConversationState(conversationState.id);
//       return `Sorry ${residentInfo.name}, there was an issue processing your booking. Please contact the front desk for assistance.`;
//     }
//   }
  
//   // Enhanced system prompt with conversation context
//   function buildSystemPromptWithContext(residentInfo, propertyCompany, conversationContext) {
//     const basePrompt = `You are Claro, a friendly virtual concierge for ${propertyCompany.name}. You're helpful, conversational, and efficient.
    
//   Property Information:
//   - Property: ${propertyCompany.name}
//   - Address: ${propertyCompany.address}
//   - Available amenities: ${propertyCompany.amenities.map(a => a.name).join(', ')}
  
//   Recent conversation context:
//   ${conversationContext}
  
//   Key responsibilities:
//   - Help with maintenance issues (log to issues collection)
//   - Assist with visitor parking passes (daily only, full-time needs front desk visit)
//   - Help with amenity bookings (residents only)
//   - Provide building information
//   - Direct complex issues to front desk
  
//   Keep responses concise but warm. Use text message appropriate language.`;
  
//     if (residentInfo.isResident) {
//       return `${basePrompt}
  
//   RESIDENT: ${residentInfo.name} (Unit ${residentInfo.unitNumber})
//   - Always address them by name
//   - They can access all resident services
//   - Reference their unit when relevant`;
//     } else {
//       return `${basePrompt}
  
//   NON-RESIDENT: General visitor
//   - Greet with "Hi there!"
//   - Limited to visitor services only (parking, general info)
//   - Cannot book amenities (direct to front desk)`;
//     }
//   }
  
//   // Enhanced parking follow-up handler
//   async function handleParkingFollowUpImproved(userMessage, conversationHistory, residentInfo, propertyCompany, conversationState) {
//     try {
//       console.log('Handling improved parking follow-up');
      
//       const lowerMessage = userMessage.toLowerCase();
      
//       // Extract info from current message using improved extraction
//       const dateInfo = extractDateInfo(userMessage);
//       const carInfo = extractCarInfoImproved(userMessage);
      
//       // Look for previously collected info in conversation state temporary data
//       let existingDate = conversationState.temporaryData?.parkingDate || null;
//       let existingPlate = conversationState.temporaryData?.licensePlate || null;
//       let existingMake = conversationState.temporaryData?.carMake || null;
      
//       // Also check recent conversation history as backup
//       if (!existingDate || !existingPlate || !existingMake) {
//         const recentMessages = conversationHistory.slice(-6);
//         for (const msg of recentMessages) {
//           if (msg.content) {
//             if (!existingDate) {
//               const historyDateInfo = extractDateInfo(msg.content);
//               if (historyDateInfo.date) {
//                 existingDate = historyDateInfo.date;
//               }
//             }
            
//             const historyCarInfo = extractCarInfoImproved(msg.content);
//             if (historyCarInfo.licensePlate && !existingPlate) {
//               existingPlate = historyCarInfo.licensePlate;
//             }
//             if (historyCarInfo.carMake && !existingMake) {
//               existingMake = historyCarInfo.carMake;
//             }
//           }
//         }
//       }
      
//       // Combine existing and new info
//       const finalDateInfo = {
//         date: dateInfo.date || existingDate
//       };
      
//       const finalCarInfo = {
//         licensePlate: carInfo.licensePlate || existingPlate,
//         carMake: carInfo.carMake || existingMake
//       };
      
//       // Update temporary data in conversation state
//       await updateConversationState(conversationState.id, {
//         temporaryData: {
//           parkingDate: finalDateInfo.date,
//           licensePlate: finalCarInfo.licensePlate,
//           carMake: finalCarInfo.carMake
//         }
//       });
      
//       // Check if we have everything
//       if (finalDateInfo.date && finalCarInfo.licensePlate && finalCarInfo.carMake) {
//         return await createParkingPass(finalCarInfo, finalDateInfo, residentInfo, propertyCompany);
//       }
      
//       // Ask for missing info with context
//       if (!finalDateInfo.date) {
//         await updateConversationState(conversationState.id, { flowStep: 'awaiting_date' });
//         return "What date do you need the parking pass for? (e.g., 'today', 'tomorrow', or 'July 30')";
//       } else if (!finalCarInfo.licensePlate) {
//         await updateConversationState(conversationState.id, { flowStep: 'awaiting_plate' });
//         const dateStr = finalDateInfo.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
//         return `Great! I have the date: ${dateStr}. What's the license plate number?`;
//       } else if (!finalCarInfo.carMake) {
//         await updateConversationState(conversationState.id, { flowStep: 'awaiting_car_info' });
//         const dateStr = finalDateInfo.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
//         return `Perfect! I have the date (${dateStr}) and license plate (${finalCarInfo.licensePlate}). What's the make and model of the car?`;
//       }
      
//       return "I'll need the date, license plate number, and car make/model for your parking pass.";
      
//     } catch (error) {
//       console.error('Error handling improved parking follow-up:', error);
//       return "I'm having trouble processing your parking information. Please try again or contact the front desk.";
//     }
//   }
  
//   // Function to get conversation history
//   async function getConversationHistory(phoneNumber, companyId, limit = 10) {
//     try {
//       const messagesSnapshot = await db.collection('messages')
//         .where('phoneNumber', '==', phoneNumber)
//         .where('companyId', '==', companyId)
//         .orderBy('timestamp', 'desc')
//         .limit(limit)
//         .get();
      
//       const messages = messagesSnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
      
//       // Return messages in chronological order (oldest first)
//       return messages.reverse();
//     } catch (error) {
//       console.error('Error fetching conversation history:', error);
//       return [];
//     }
//   }
  
//   // Function to store messages in Firebase
//   async function storeMessage(phoneNumber, content, direction, twilioMessageSid = null, companyId) {
//     try {
//       const messageData = {
//         phoneNumber,
//         content,
//         direction, // 'incoming' or 'outgoing'
//         companyId,
//         timestamp: admin.firestore.FieldValue.serverTimestamp(),
//         createdAt: new Date().toISOString()
//       };
      
//       if (twilioMessageSid) {
//         messageData.twilioMessageSid = twilioMessageSid;
//       }
      
//       await db.collection('messages').add(messageData);
//       console.log(`Stored ${direction} message for ${phoneNumber} at company ${companyId}`);
//     } catch (error) {
//       console.error('Error storing message:', error);
//       throw error;
//     }
//   }
  
//   // Function to analyze if message is a booking request
//   async function analyzeBookingRequest(message, residentInfo, propertyCompany, conversationHistory = []) {
//     try {
//       const bookingKeywords = ['book', 'reserve', 'schedule', 'party room', 'gym', 'pool', 'bbq', 'fitness'];
//       const availabilityKeywords = ['available', 'booked', 'booking time', 'anyone else', 'who has', 'check availability'];
//       const managementKeywords = ['edit', 'change', 'update', 'cancel', 'modify', 'reschedule', 'my booking', 'my bookings', 'show my'];
//       const updateKeywords = ['make it', 'change it to', 'update it to', 'move it to', 'instead'];
//       const parkingKeywords = ['parking', 'park', 'visitor parking', 'parking pass', 'guest parking'];
//       const parkingEditKeywords = ['license plate', 'plate number', 'wrong plate', 'incorrect plate', 'edit plate', 'change plate'];
//       const parkingStatusKeywords = ['do i have', 'any parking', 'my parking', 'active parking', 'current parking', 'existing parking', 'show parking'];
//       const lowerMessage = message.toLowerCase();
      
//       // Check if this is a parking status inquiry
//       const isParkingStatus = parkingStatusKeywords.some(keyword => lowerMessage.includes(keyword)) ||
//                              (lowerMessage.includes('parking') && (lowerMessage.includes('do i') || lowerMessage.includes('any') || lowerMessage.includes('my') || lowerMessage.includes('current') || lowerMessage.includes('active')));
      
//       if (isParkingStatus) {
//         return { isParkingStatus: true };
//       }
      
//       // Check if this is a parking pass edit request
//       const isParkingEdit = parkingEditKeywords.some(keyword => lowerMessage.includes(keyword)) ||
//                            (lowerMessage.includes('edit') && recentParkingContext(conversationHistory)) ||
//                            (lowerMessage.includes('wrong') && recentParkingContext(conversationHistory)) ||
//                            (lowerMessage.includes('not right') && recentParkingContext(conversationHistory));
      
//       if (isParkingEdit) {
//         return { isParkingEdit: true };
//       }
      
//       // Check if this is a parking request (but not if they're asking about existing passes)
//       const isParkingRequest = parkingKeywords.some(keyword => lowerMessage.includes(keyword)) &&
//                               !lowerMessage.includes('do i') &&
//                               !lowerMessage.includes('any') &&
//                               !lowerMessage.includes('have') &&
//                               !lowerMessage.includes('current') &&
//                               !lowerMessage.includes('active') &&
//                               !lowerMessage.includes('existing');
      
//       if (isParkingRequest) {
//         return { isParkingRequest: true };
//       }
      
//       // Check if this is a booking update request (like "make it 2-3pm instead")
//       const isBookingUpdate = updateKeywords.some(keyword => lowerMessage.includes(keyword)) && 
//                              /(\d{1,2}):?(\d{2})?\s*(am|pm)|(\d{1,2})\s*-\s*(\d{1,2})\s*(pm|am)/i.test(lowerMessage);
//       if (isBookingUpdate) {
//         return { isBookingUpdate: true, updateMessage: message };
//       }
      
//       // Check if this is a booking management request (but not if recent parking context)
//       const isBookingManagement = managementKeywords.some(keyword => lowerMessage.includes(keyword)) && 
//                                  !recentParkingContext(conversationHistory);
//       if (isBookingManagement) {
//         return { isBookingManagement: true };
//       }
      
//       // Check if this is an availability inquiry
//       const isAvailabilityCheck = availabilityKeywords.some(keyword => lowerMessage.includes(keyword));
//       if (isAvailabilityCheck) {
//         return { isAvailabilityCheck: true };
//       }
      
//       const isBookingRequest = bookingKeywords.some(keyword => lowerMessage.includes(keyword));
      
//       // Check for active booking conversation context in recent messages
//       const recentMessages = conversationHistory.slice(-8); // Last 8 messages for more context
      
//       // Look for booking flow indicators
//       const hasActiveBookingFlow = recentMessages.some(msg => 
//         msg.content && (
//           msg.content.toLowerCase().includes('what date and time would you prefer') ||
//           msg.content.toLowerCase().includes('what end time') ||
//           msg.content.toLowerCase().includes('how long would you like') ||
//           msg.content.toLowerCase().includes('which one would you like to book') ||
//           msg.content.toLowerCase().includes('great! i can help you book') ||
//           msg.content.toLowerCase().includes('here are the available options')
//         )
//       );
      
//       // Check for active parking flow
//       const hasActiveParkingFlow = recentMessages.some(msg =>
//         msg.content && (
//           msg.content.toLowerCase().includes('license plate') ||
//           msg.content.toLowerCase().includes('car make') ||
//           msg.content.toLowerCase().includes('what car are you driving') ||
//           msg.content.toLowerCase().includes('parking pass') ||
//           msg.content.toLowerCase().includes('what date do you need parking')
//         )
//       );
      
//       // If we have parking flow and this looks like car info, treat as parking follow-up
//       if (hasActiveParkingFlow && !isParkingRequest && !isParkingStatus) {
//         return { isParkingFollowUp: true };
//       }
      
//       // Also check if user mentioned a specific amenity in recent messages
//       const hasRecentAmenityMention = recentMessages.some(msg => 
//         msg.content && propertyCompany.amenities.some(a => 
//           msg.content.toLowerCase().includes(a.name.toLowerCase()) || 
//           msg.content.toLowerCase().includes(a.type.toLowerCase())
//         )
//       );
      
//       // Check if this message contains time/date info
//       const hasTimeInfo = /(\d{1,2}):?(\d{2})?\s*(am|pm)|(\d{1,2})\s*-\s*(\d{1,2})\s*(pm|am)|today|tomorrow|this\s+(week|weekend)|next\s+(week|weekend)|(\d+)\s*(hour|hr)/i.test(lowerMessage);
      
//       // If we have an active booking flow and this message has time info, treat as booking request
//       if (hasActiveBookingFlow && hasTimeInfo) {
//         console.log('Detected active booking flow with time info');
        
//         // Find the most recently mentioned amenity
//         let amenity = null;
//         for (const msg of recentMessages.reverse()) {
//           if (msg.content) {
//             amenity = propertyCompany.amenities.find(a => 
//               msg.content.toLowerCase().includes(a.name.toLowerCase()) || 
//               msg.content.toLowerCase().includes(a.type.toLowerCase())
//             );
//             if (amenity) {
//               console.log(`Found amenity in context: ${amenity.name}`);
//               break;
//             }
//           }
//         }
        
//         const timeInfo = parseTimeRange(lowerMessage);
        
//         // Check if we need end time
//         const needsEndTime = timeInfo.startTime && !timeInfo.endTime && !lowerMessage.includes('-');
        
//         return {
//           isBookingRequest: true,
//           amenity,
//           startTime: timeInfo.startTime,
//           endTime: timeInfo.endTime,
//           needsAmenitySelection: !amenity,
//           needsDateTime: !timeInfo.startTime,
//           needsEndTime: needsEndTime,
//           isFollowUp: true
//         };
//       }
      
//       // If user mentioned an amenity and we have active booking flow, treat as amenity selection
//       if (hasActiveBookingFlow && hasRecentAmenityMention && !hasTimeInfo) {
//         const amenity = propertyCompany.amenities.find(a => 
//           lowerMessage.includes(a.name.toLowerCase()) || 
//           lowerMessage.includes(a.type.toLowerCase())
//         );
        
//         if (amenity) {
//           console.log(`User selected amenity: ${amenity.name}`);
//           return {
//             isBookingRequest: true,
//             amenity,
//             startTime: null,
//             endTime: null,
//             needsAmenitySelection: false,
//             needsDateTime: true,
//             isFollowUp: true
//           };
//         }
//       }
      
//       if (!isBookingRequest) {
//         return { isBookingRequest: false };
//       }
      
//       // Find mentioned amenity in current message
//       const amenity = propertyCompany.amenities.find(a => 
//         lowerMessage.includes(a.name.toLowerCase()) || 
//         lowerMessage.includes(a.type.toLowerCase())
//       );
      
//       if (!amenity && isBookingRequest) {
//         return { isBookingRequest: true, needsAmenitySelection: true };
//       }
      
//       // Try to extract date/time from current message
//       const timeInfo = parseTimeRange(lowerMessage);
      
//       // Check if we need end time for single time bookings
//       const needsEndTime = timeInfo.startTime && !timeInfo.endTime && !lowerMessage.includes('-');
      
//       return {
//         isBookingRequest: true,
//         amenity,
//         startTime: timeInfo.startTime,
//         endTime: timeInfo.endTime,
//         needsDateTime: !timeInfo.startTime,
//         needsEndTime: needsEndTime
//       };
//     } catch (error) {
//       console.error('Error analyzing booking request:', error);
//       return { isBookingRequest: false };
//     }
//   }
  
//   // Helper function to check if there's recent parking context
//   function recentParkingContext(conversationHistory) {
//     const recentMessages = conversationHistory.slice(-4);
//     return recentMessages.some(msg => 
//       msg.content && (
//         msg.content.toLowerCase().includes('parking pass') ||
//         msg.content.toLowerCase().includes('created a daily visitor parking') ||
//         msg.content.toLowerCase().includes('license plate') ||
//         msg.content.toLowerCase().includes('pick up your pass')
//       )
//     );
//   }
  
//   // Function to parse date/time from natural language including time ranges and durations
//   function parseTimeRange(dateTimeString) {
//     try {
//       const now = new Date();
//       let startTime = null;
//       let endTime = null;
      
//       console.log(`Parsing time from: "${dateTimeString}"`);
      
//       // Handle duration patterns like "2 hours", "3 hrs"
//       const durationPattern = /(\d+)\s*(hour|hr|hours|hrs)/i;
//       const durationMatch = dateTimeString.match(durationPattern);
//       let durationHours = null;
      
//       if (durationMatch) {
//         durationHours = parseInt(durationMatch[1]);
//         console.log(`Found duration: ${durationHours} hours`);
//       }
      
//       // Handle time ranges like "6-8pm", "6pm-8pm", "3:30-5:30pm"
//       const rangePattern = /(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i;
//       const rangeMatch = dateTimeString.match(rangePattern);
      
//       if (rangeMatch) {
//         console.log('Found time range pattern');
//         const startHour = parseInt(rangeMatch[1]);
//         const startMinute = parseInt(rangeMatch[2] || '0');
//         const endHour = parseInt(rangeMatch[3]);
//         const endMinute = parseInt(rangeMatch[4] || '0');
//         const period = rangeMatch[5].toLowerCase();
        
//         // Create start time
//         let adjustedStartHour = startHour;
//         let adjustedEndHour = endHour;
        
//         if (period === 'pm' && startHour !== 12) adjustedStartHour += 12;
//         if (period === 'pm' && endHour !== 12) adjustedEndHour += 12;
//         if (period === 'am' && startHour === 12) adjustedStartHour = 0;
//         if (period === 'am' && endHour === 12) adjustedEndHour = 0;
        
//         // Handle ranges where start hour is less than end hour but same period
//         if (period === 'pm' && startHour < endHour && endHour !== 12) {
//           adjustedEndHour = endHour + 12;
//         }
        
//         startTime = new Date(now);
//         endTime = new Date(now);
        
//         // Check if it includes "today" or "tomorrow"
//         if (dateTimeString.toLowerCase().includes('tomorrow')) {
//           startTime.setDate(startTime.getDate() + 1);
//           endTime.setDate(endTime.getDate() + 1);
//           console.log('Setting for tomorrow');
//         } else if (dateTimeString.toLowerCase().includes('today')) {
//           console.log('Setting for today');
//         } else {
//           // Default to tomorrow if no day specified and time has passed today
//           const todayWithTime = new Date(now);
//           todayWithTime.setHours(adjustedStartHour, startMinute, 0, 0);
//           if (todayWithTime < now) {
//             startTime.setDate(startTime.getDate() + 1);
//             endTime.setDate(endTime.getDate() + 1);
//             console.log('Time has passed today, setting for tomorrow');
//           }
//         }
        
//         startTime.setHours(adjustedStartHour, startMinute, 0, 0);
//         endTime.setHours(adjustedEndHour, endMinute, 0, 0);
        
//         console.log(`Parsed range: ${startTime} to ${endTime}`);
//         return { startTime, endTime };
//       }
      
//       // Handle single time patterns
//       const singleTimePatterns = [
//         /tomorrow\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
//         /today\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
//         /(\d{1,2}):?(\d{2})?\s*(am|pm)/i
//       ];
      
//       for (const pattern of singleTimePatterns) {
//         const match = dateTimeString.match(pattern);
//         if (match) {
//           console.log('Found single time pattern');
//           let hour = parseInt(match[1]);
//           const minute = parseInt(match[2] || '0');
//           const ampm = match[3].toLowerCase();
          
//           if (ampm === 'pm' && hour !== 12) hour += 12;
//           if (ampm === 'am' && hour === 12) hour = 0;
          
//           startTime = new Date(now);
          
//           if (dateTimeString.toLowerCase().includes('tomorrow')) {
//             startTime.setDate(startTime.getDate() + 1);
//             console.log('Setting single time for tomorrow');
//           } else if (dateTimeString.toLowerCase().includes('today')) {
//             console.log('Setting single time for today');
//           }
          
//           startTime.setHours(hour, minute, 0, 0);
          
//           // Use duration if specified, otherwise don't set end time
//           if (durationHours) {
//             endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
//             console.log(`Using duration: ${durationHours} hours`);
//           }
          
//           console.log(`Parsed single time: ${startTime}${endTime ? ` to ${endTime}` : ' (no end time)'}`);
//           return { startTime, endTime };
//         }
//       }
      
//       console.log('No time pattern found');
//       return { startTime: null, endTime: null };
//     } catch (error) {
//       console.error('Error parsing time range:', error);
//       return { startTime: null, endTime: null };
//     }
//   }
  
//   // Function to handle booking update requests
//   async function handleBookingUpdate(userMessage, residentInfo, propertyCompany) {
//     try {
//       console.log(`Handling booking update for resident: ${residentInfo.id}`);
      
//       // Get user's most recent upcoming booking
//       const now = new Date();
//       const bookingsSnapshot = await db.collection('bookings')
//         .where('residentId', '==', residentInfo.id)
//         .where('companyId', '==', propertyCompany.id)
//         .where('status', 'in', ['pending', 'confirmed'])
//         .get();
      
//       const userBookings = bookingsSnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
      
//       // Filter to upcoming bookings and sort by start date
//       const upcomingBookings = userBookings
//         .filter(booking => booking.startDate.toDate() > now)
//         .sort((a, b) => a.startDate.toDate() - b.startDate.toDate());
      
//       if (upcomingBookings.length === 0) {
//         return `Hi ${residentInfo.name}! I don't see any upcoming bookings to update. Would you like to make a new booking?`;
//       }
      
//       // Get the most recent booking (first in sorted list)
//       const bookingToUpdate = upcomingBookings[0];
      
//       // Parse the new time from the message
//       const timeInfo = parseTimeRange(userMessage);
      
//       if (!timeInfo.startTime) {
//         return `Hi ${residentInfo.name}! I'd be happy to update your booking, but I couldn't understand the new time. Could you please specify the time like "2-3pm" or "3pm to 5pm"?`;
//       }
      
//       const newStartTime = timeInfo.startTime;
//       const newEndTime = timeInfo.endTime || new Date(newStartTime.getTime() + 2 * 60 * 60 * 1000);
      
//       // Find the amenity details
//       const amenity = propertyCompany.amenities.find(a => a.id === bookingToUpdate.amenityId);
//       const amenityName = amenity ? amenity.name : bookingToUpdate.amenityId;
      
//       // Check if new time is available
//       const availabilityResult = await checkAmenityAvailability(
//         bookingToUpdate.amenityId,
//         newStartTime,
//         newEndTime,
//         propertyCompany.id,
//         bookingToUpdate.id // Exclude current booking from conflict check
//       );
      
//       if (!availabilityResult.available) {
//         if (availabilityResult.reason === 'outside_business_hours') {
//           return `Sorry ${residentInfo.name}, the ${amenityName} is only available during business hours: ${availabilityResult.businessHours}. Would you like to try a different time?`;
//         } else if (availabilityResult.reason === 'already_booked') {
//           const conflictTimes = availabilityResult.conflictingSlots.map(slot => {
//             const start = slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             const end = slot.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             return `${start} - ${end}`;
//           }).join(', ');
          
//           return `Sorry ${residentInfo.name}, the ${amenityName} is already booked during that time. Current bookings: ${conflictTimes}. Would you like to try a different time?`;
//         }
//       }
      
//       // Update the booking
//       await updateBooking(bookingToUpdate.id, {
//         startDate: admin.firestore.Timestamp.fromDate(newStartTime),
//         endDate: admin.firestore.Timestamp.fromDate(newEndTime),
//         title: `${amenityName} - ${residentInfo.name}`,
//         notes: `${bookingToUpdate.notes} - Updated via SMS`
//       });
      
//       const formatDate = newStartTime.toLocaleDateString('en-US', {
//         weekday: 'long',
//         month: 'long',
//         day: 'numeric'
//       });
      
//       const formatStartTime = newStartTime.toLocaleTimeString('en-US', {
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       });
      
//       const formatEndTime = newEndTime.toLocaleTimeString('en-US', {
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       });
      
//       return `Perfect ${residentInfo.name}! I've updated your ${amenityName} booking to ${formatDate} from ${formatStartTime} to ${formatEndTime}. Your updated booking is confirmed!`;
      
//     } catch (error) {
//       console.error('Error handling booking update:', error);
//       return `Sorry ${residentInfo.name}, I'm having trouble updating your booking right now. Please try again or contact the front desk.`;
//     }
//   }

//   function parseTimeRange(dateTimeString) {
//     try {
//       const now = new Date();
//       let startTime = null;
//       let endTime = null;
      
//       console.log(`Parsing time from: "${dateTimeString}"`);
      
//       const lowerMessage = dateTimeString.toLowerCase();
      
//       // Determine the base date first
//       let baseDate = new Date(now);
      
//       if (lowerMessage.includes('tomorrow')) {
//         baseDate.setDate(baseDate.getDate() + 1);
//       } else if (lowerMessage.includes('today')) {
//         // Keep today's date
//       } else if (lowerMessage.includes('friday') || lowerMessage.includes('monday') || 
//                  lowerMessage.includes('tuesday') || lowerMessage.includes('wednesday') || 
//                  lowerMessage.includes('thursday') || lowerMessage.includes('saturday') || 
//                  lowerMessage.includes('sunday')) {
//         // Find next occurrence of the specified day
//         const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
//         const targetDay = days.findIndex(day => lowerMessage.includes(day));
//         if (targetDay !== -1) {
//           const todayDay = baseDate.getDay();
//           let daysUntilTarget = targetDay - todayDay;
//           if (daysUntilTarget <= 0) {
//             daysUntilTarget += 7; // Next week
//           }
//           baseDate.setDate(baseDate.getDate() + daysUntilTarget);
//         }
//       }
      
//       // Handle duration patterns like "for 2 hours"
//       const durationPattern = /for\s+(\d+)\s*(hour|hr|hours|hrs)/i;
//       const durationMatch = dateTimeString.match(durationPattern);
//       let durationHours = null;
      
//       if (durationMatch) {
//         durationHours = parseInt(durationMatch[1]);
//         console.log(`Found duration: ${durationHours} hours`);
//       }
      
//       // Handle time ranges like "6-8pm", "6pm-8pm", "3:30-5:30pm"
//       const rangePatterns = [
//         /(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
//         /(\d{1,2})\s*(am|pm)\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
//         /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i
//       ];
      
//       for (const pattern of rangePatterns) {
//         const rangeMatch = dateTimeString.match(pattern);
//         if (rangeMatch) {
//           console.log('Found time range pattern:', rangeMatch);
          
//           let startHour, startMinute, endHour, endMinute, period;
          
//           if (pattern.toString().includes('am|pm')) {
//             // Format: "6-8pm" or "6pm-8pm"
//             startHour = parseInt(rangeMatch[1]);
//             startMinute = parseInt(rangeMatch[2] || '0');
//             endHour = parseInt(rangeMatch[3]);
//             endMinute = parseInt(rangeMatch[4] || '0');
//             period = rangeMatch[5].toLowerCase();
            
//             // Apply period to both times
//             if (period === 'pm' && startHour !== 12) startHour += 12;
//             if (period === 'pm' && endHour !== 12) endHour += 12;
//             if (period === 'am' && startHour === 12) startHour = 0;
//             if (period === 'am' && endHour === 12) endHour = 0;
//           } else {
//             // Format: "14:30-16:30" (24-hour)
//             startHour = parseInt(rangeMatch[1]);
//             startMinute = parseInt(rangeMatch[2]);
//             endHour = parseInt(rangeMatch[3]);
//             endMinute = parseInt(rangeMatch[4]);
//           }
          
//           startTime = new Date(baseDate);
//           endTime = new Date(baseDate);
          
//           startTime.setHours(startHour, startMinute, 0, 0);
//           endTime.setHours(endHour, endMinute, 0, 0);
          
//           console.log(`Parsed range: ${startTime} to ${endTime}`);
//           return { startTime, endTime };
//         }
//       }
      
//       // Handle single time patterns with "until" or "to"
//       const untilPattern = /(\d{1,2}):?(\d{2})?\s*(am|pm).*?until\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i;
//       const untilMatch = dateTimeString.match(untilPattern);
      
//       if (untilMatch) {
//         let startHour = parseInt(untilMatch[1]);
//         const startMinute = parseInt(untilMatch[2] || '0');
//         const startPeriod = untilMatch[3].toLowerCase();
        
//         let endHour = parseInt(untilMatch[4]);
//         const endMinute = parseInt(untilMatch[5] || '0');
//         const endPeriod = untilMatch[6].toLowerCase();
        
//         if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
//         if (startPeriod === 'am' && startHour === 12) startHour = 0;
//         if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
//         if (endPeriod === 'am' && endHour === 12) endHour = 0;
        
//         startTime = new Date(baseDate);
//         endTime = new Date(baseDate);
        
//         startTime.setHours(startHour, startMinute, 0, 0);
//         endTime.setHours(endHour, endMinute, 0, 0);
        
//         console.log(`Parsed until pattern: ${startTime} to ${endTime}`);
//         return { startTime, endTime };
//       }
      
//       // Handle single time patterns
//       const singleTimePatterns = [
//         /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
//         /(\d{1,2}):?(\d{2})?\s*(am|pm)/i
//       ];
      
//       for (const pattern of singleTimePatterns) {
//         const match = dateTimeString.match(pattern);
//         if (match) {
//           console.log('Found single time pattern:', match);
//           let hour = parseInt(match[1]);
//           const minute = parseInt(match[2] || '0');
//           const ampm = match[3].toLowerCase();
          
//           if (ampm === 'pm' && hour !== 12) hour += 12;
//           if (ampm === 'am' && hour === 12) hour = 0;
          
//           startTime = new Date(baseDate);
//           startTime.setHours(hour, minute, 0, 0);
          
//           // If duration is specified, calculate end time
//           if (durationHours) {
//             endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
//             console.log(`Using duration: ${durationHours} hours`);
//           }
          
//           console.log(`Parsed single time: ${startTime}${endTime ? ` to ${endTime}` : ' (no end time)'}`);
//           return { startTime, endTime };
//         }
//       }
      
//       console.log('No time pattern found');
//       return { startTime: null, endTime: null };
//     } catch (error) {
//       console.error('Error parsing time range:', error);
//       return { startTime: null, endTime: null };
//     }
//   }
  
//   async function handleBookingManagementImproved(userMessage, residentInfo, propertyCompany) {
//     try {
//       const lowerMessage = userMessage.toLowerCase();
      
//       console.log(`Handling booking management for resident: ${residentInfo.id}`);
//       console.log(`Company: ${propertyCompany.id}`);
      
//       // Get user's current bookings from database
//       const bookingsSnapshot = await db.collection('bookings')
//         .where('residentId', '==', residentInfo.id)
//         .where('companyId', '==', propertyCompany.id)
//         .where('status', 'in', ['pending', 'confirmed'])
//         .orderBy('startDate', 'asc')
//         .get();
      
//       console.log(`Found ${bookingsSnapshot.docs.length} bookings for resident`);
      
//       const userBookings = bookingsSnapshot.docs.map(doc => {
//         const data = doc.data();
//         console.log(`Booking: ${doc.id}`, data);
//         return {
//           id: doc.id,
//           ...data
//         };
//       });
      
//       // Filter to upcoming bookings only
//       const now = new Date();
//       const upcomingBookings = userBookings.filter(booking => {
//         const startDate = booking.startDate.toDate();
//         console.log(`Comparing ${startDate} > ${now}: ${startDate > now}`);
//         return startDate > now;
//       });
      
//       console.log(`Found ${upcomingBookings.length} upcoming bookings`);
      
//       if (upcomingBookings.length === 0) {
//         return `Hi ${residentInfo.name}! You don't have any upcoming bookings to manage. Would you like to make a new booking?`;
//       }
      
//       // Format bookings list using the new helper function
//       const bookingsList = formatBookingsList(upcomingBookings, propertyCompany);
      
//       // Check if they want to edit/cancel a specific booking
//       if (lowerMessage.includes('edit') || lowerMessage.includes('change') || lowerMessage.includes('modify')) {
//         return `Hi ${residentInfo.name}! Here are your upcoming bookings:\n\n${bookingsList}\n\nWhich booking would you like to edit? Just reply with the number (e.g., "1") or tell me what you'd like to change.`;
//       }
      
//       if (lowerMessage.includes('cancel')) {
//         return `Hi ${residentInfo.name}! Here are your upcoming bookings:\n\n${bookingsList}\n\nWhich booking would you like to cancel? Just reply with the number (e.g., "1").`;
//       }
      
//       // Default - show all bookings
//       return `Hi ${residentInfo.name}! Here are your upcoming bookings:\n\n${bookingsList}\n\nTo edit a booking, say "edit booking 1" or to cancel say "cancel booking 1". You can also make a new booking anytime!`;
      
//     } catch (error) {
//       console.error('Error handling booking management:', error);
//       console.error('Error details:', error.stack);
//       return `Sorry ${residentInfo.name}, I'm having trouble accessing your bookings right now. Please try again or contact the front desk. Error: ${error.message}`;
//     }
//   }
  
//   // Function to handle availability checks
//   async function handleAvailabilityCheck(userMessage, conversationHistory, residentInfo, propertyCompany) {
//     try {
//       const lowerMessage = userMessage.toLowerCase();
      
//       // Try to find what amenity and time they're asking about from recent conversation
//       const recentMessages = conversationHistory.slice(-6);
//       let amenity = null;
//       let timeInfo = { startTime: null, endTime: null };
      
//       // Look for amenity in recent messages or current message
//       for (const msg of [...recentMessages, { content: userMessage }].reverse()) {
//         if (msg.content) {
//           amenity = propertyCompany.amenities.find(a => 
//             msg.content.toLowerCase().includes(a.name.toLowerCase()) || 
//             msg.content.toLowerCase().includes(a.type.toLowerCase())
//           );
//           if (amenity) break;
//         }
//       }
      
//       // Look for time in recent messages or current message
//       for (const msg of [...recentMessages, { content: userMessage }].reverse()) {
//         if (msg.content) {
//           const parsedTime = parseTimeRange(msg.content);
//           if (parsedTime.startTime) {
//             timeInfo = parsedTime;
//             break;
//           }
//         }
//       }
      
//       if (!amenity || !timeInfo.startTime) {
//         return `Hi ${residentInfo.name}! I'd be happy to check availability for you. Could you let me know which amenity and what time you're interested in?`;
//       }
      
//       const finalEndTime = timeInfo.endTime || new Date(timeInfo.startTime.getTime() + 2 * 60 * 60 * 1000);
      
//       // Check availability
//       const availabilityResult = await checkAmenityAvailability(
//         amenity.id,
//         timeInfo.startTime,
//         finalEndTime,
//         propertyCompany.id
//       );
      
//       if (availabilityResult.available) {
//         const formatDate = timeInfo.startTime.toLocaleDateString('en-US', {
//           weekday: 'long',
//           month: 'long',
//           day: 'numeric'
//         });
        
//         const formatStartTime = timeInfo.startTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         const formatEndTime = finalEndTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         return `Good news ${residentInfo.name}! The ${amenity.name} is available on ${formatDate} from ${formatStartTime} to ${formatEndTime}. Would you like me to book it for you?`;
//       } else {
//         if (availabilityResult.reason === 'outside_business_hours') {
//           return `Sorry ${residentInfo.name}, the ${amenity.name} is only available during business hours: ${availabilityResult.businessHours}. Would you like to try a different time?`;
//         } else if (availabilityResult.reason === 'already_booked') {
//           const conflictTimes = availabilityResult.conflictingSlots.map(slot => {
//             const start = slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             const end = slot.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             return `${start} - ${end}`;
//           }).join(', ');
          
//           return `Sorry ${residentInfo.name}, the ${amenity.name} is already booked during that time. Current bookings: ${conflictTimes}. Would you like to try a different time?`;
//         } else {
//           return `Sorry ${residentInfo.name}, I'm having trouble checking availability right now. Please try again or contact the front desk.`;
//         }
//       }
//     } catch (error) {
//       console.error('Error handling availability check:', error);
//       return `Sorry ${residentInfo.name}, I'm having trouble checking availability right now. Please contact the front desk for assistance.`;
//     }
//   }
  
//   // Function to handle booking requests
//   async function handleBookingRequest(bookingRequest, residentInfo, propertyCompany) {
//     try {
//       console.log('Handling booking request:', bookingRequest);
//       console.log('Resident info:', residentInfo);
      
//       if (bookingRequest.needsAmenitySelection) {
//         const amenityList = propertyCompany.amenities
//           .map(a => `• ${a.name}`)
//           .join('\n');
        
//         return `Hi ${residentInfo.name}! I'd be happy to help you book an amenity. Here are the available options:\n\n${amenityList}\n\nWhich one would you like to book and for what date/time?`;
//       }
      
//       if (bookingRequest.needsDateTime) {
//         return `Great! I can help you book the ${bookingRequest.amenity.name}. What date and time would you prefer? (e.g., "today at 3pm", "tomorrow 6-8pm", or "Friday 2-4pm")`;
//       }
      
//       // Check if we need end time
//       if (bookingRequest.needsEndTime) {
//         const startTimeStr = bookingRequest.startTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         return `Perfect! I have you down for the ${bookingRequest.amenity.name} starting at ${startTimeStr}. What end time would you like? (e.g., "until 8pm" or "for 2 hours")`;
//       }
      
//       // We have amenity and time, check availability
//       const { amenity, startTime, endTime } = bookingRequest;
//       const finalEndTime = endTime || new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2-hour booking if no end time
      
//       console.log('Checking availability for:', {
//         amenityId: amenity.id,
//         amenityName: amenity.name,
//         startTime: startTime.toISOString(),
//         endTime: finalEndTime.toISOString()
//       });
      
//       const availabilityResult = await checkAmenityAvailability(
//         amenity.id,
//         startTime,
//         finalEndTime,
//         propertyCompany.id
//       );
      
//       console.log('Availability result:', availabilityResult);
      
//       if (!availabilityResult.available) {
//         if (availabilityResult.reason === 'outside_business_hours') {
//           return `Sorry ${residentInfo.name}, the ${amenity.name} is only available during business hours: ${availabilityResult.businessHours}. Would you like to try a different time?`;
//         } else if (availabilityResult.reason === 'already_booked') {
//           const conflictTimes = availabilityResult.conflictingSlots.map(slot => {
//             const start = slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             const end = slot.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//             return `${start} - ${end}`;
//           }).join(', ');
          
//           return `Sorry ${residentInfo.name}, the ${amenity.name} is already booked during that time. Current bookings: ${conflictTimes}. Would you like to try a different time?`;
//         } else {
//           return `Sorry ${residentInfo.name}, I'm having trouble checking availability right now. Please try again or contact the front desk.`;
//         }
//       }
      
//       // Create the booking
//       console.log('Attempting to create booking...');
      
//       try {
//         const bookingId = await createBooking(
//           amenity.id,
//           amenity.name,
//           startTime,
//           finalEndTime,
//           residentInfo,
//           propertyCompany.id,
//           `Booked via SMS by ${residentInfo.name}`
//         );
        
//         console.log('Booking created successfully with ID:', bookingId);
        
//         const formatDate = startTime.toLocaleDateString('en-US', {
//           weekday: 'long',
//           year: 'numeric',
//           month: 'long',
//           day: 'numeric'
//         });
        
//         const formatStartTime = startTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         const formatEndTime = finalEndTime.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true
//         });
        
//         return `Perfect ${residentInfo.name}! I've booked the ${amenity.name} for you on ${formatDate} from ${formatStartTime} to ${formatEndTime}. Your booking is currently pending approval and you'll receive confirmation soon. Booking ID: ${bookingId.substring(0, 8)}\n\nTo view or edit your bookings anytime, just say "my bookings"!`;
        
//       } catch (bookingError) {
//         console.error('Failed to create booking:', bookingError);
//         return `Sorry ${residentInfo.name}, I encountered an error while creating your booking. Please try again or contact the front desk for assistance. Error: ${bookingError.message}`;
//       }
      
//     } catch (error) {
//       console.error('Error handling booking request:', error);
//       return `I'm sorry ${residentInfo.name}, there was an issue processing your booking request. Please contact the front desk for assistance.`;
//     }
//   }
  
//   // Function to check amenity availability including business hours
//   async function checkAmenityAvailability(amenityId, startDate, endDate, companyId) {
//     try {
//       console.log('Checking availability for:', {
//         amenityId,
//         startDate: startDate.toISOString(),
//         endDate: endDate.toISOString(),
//         companyId
//       });
      
//       // Get company data for business hours if needed
//       const companyDoc = await db.collection('propertyCompanies').doc(companyId).get();
//       const companyData = companyDoc.data();
      
//       // Check business hours if available
//       if (companyData.settings && companyData.settings.businessHours) {
//         const businessStart = companyData.settings.businessHours.start; // "09:00"
//         const businessEnd = companyData.settings.businessHours.end; // "17:00"
        
//         const [startHour, startMinute] = businessStart.split(':').map(Number);
//         const [endHour, endMinute] = businessEnd.split(':').map(Number);
        
//         const requestStartHour = startDate.getHours();
//         const requestEndHour = endDate.getHours();
        
//         // Convert to minutes for easier comparison
//         const businessStartMinutes = startHour * 60 + startMinute;
//         const businessEndMinutes = endHour * 60 + endMinute;
//         const requestStartMinutes = requestStartHour * 60 + startDate.getMinutes();
//         const requestEndMinutes = requestEndHour * 60 + endDate.getMinutes();
        
//         if (requestStartMinutes < businessStartMinutes || requestEndMinutes > businessEndMinutes) {
//           return {
//             available: false,
//             reason: 'outside_business_hours',
//             businessHours: `${businessStart} - ${businessEnd}`
//           };
//         }
//       }
      
//       // Check for conflicting bookings
//       const bookingsSnapshot = await db.collection('bookings')
//         .where('amenityId', '==', amenityId)
//         .where('companyId', '==', companyId)
//         .where('status', 'in', ['confirmed', 'pending'])
//         .get();
      
//       console.log(`Found ${bookingsSnapshot.docs.length} existing bookings for amenity`);
      
//       const conflictingBookings = bookingsSnapshot.docs.filter(doc => {
//         const booking = doc.data();
//         const bookingStart = booking.startDate.toDate();
//         const bookingEnd = booking.endDate.toDate();
        
//         console.log('Checking conflict with booking:', {
//           bookingId: doc.id,
//           bookingStart: bookingStart.toISOString(),
//           bookingEnd: bookingEnd.toISOString(),
//           requestStart: startDate.toISOString(),
//           requestEnd: endDate.toISOString()
//         });
        
//         // Check for time conflicts: overlapping if start < other_end AND end > other_start
//         const hasConflict = (startDate < bookingEnd && endDate > bookingStart);
//         console.log('Has conflict:', hasConflict);
        
//         return hasConflict;
//       });
      
//       if (conflictingBookings.length > 0) {
//         console.log(`Found ${conflictingBookings.length} conflicting bookings`);
//         return {
//           available: false,
//           reason: 'already_booked',
//           conflictingSlots: conflictingBookings.map(doc => {
//             const booking = doc.data();
//             return {
//               start: booking.startDate.toDate(),
//               end: booking.endDate.toDate(),
//               title: booking.title || booking.amenityName
//             };
//           })
//         };
//       }
      
//       console.log('No conflicts found, amenity is available');
//       return { available: true };
//     } catch (error) {
//       console.error('Error checking availability:', error);
//       return { available: false, reason: 'error' };
//     }
//   }
  
//   // Function to create a booking
//   async function createBooking(amenityId, amenityName, startDate, endDate, residentInfo, companyId, notes = '') {
//     try {
//       console.log('Creating booking with params:', {
//         amenityId,
//         amenityName,
//         startDate: startDate.toISOString(),
//         endDate: endDate.toISOString(),
//         residentId: residentInfo.id,
//         residentName: residentInfo.name,
//         companyId,
//         notes
//       });
  
//       const bookingData = {
//         amenityId,
//         companyId,
//         title: `${amenityName} - ${residentInfo.name}`,
//         startDate: admin.firestore.Timestamp.fromDate(startDate),
//         endDate: admin.firestore.Timestamp.fromDate(endDate),
//         status: 'pending',
//         notes,
//         residentId: residentInfo.id,
//         contactInfo: {
//           name: residentInfo.name,
//           phone: residentInfo.phone,
//           email: residentInfo.email || '' // Handle case where email might be undefined
//         },
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       };
      
//       console.log('Booking data to be saved:', bookingData);
      
//       const bookingRef = await db.collection('bookings').add(bookingData);
//       console.log('Booking created successfully with ID:', bookingRef.id);
      
//       return bookingRef.id;
//     } catch (error) {
//       console.error('Error creating booking:', error);
//       console.error('Error details:', {
//         code: error.code,
//         message: error.message,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }
  
//   // Function to update an existing booking
//   async function updateBooking(bookingId, updateData) {
//     try {
//       console.log('Updating booking:', bookingId, updateData);
      
//       const updatePayload = {
//         ...updateData,
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       };
      
//       await db.collection('bookings').doc(bookingId).update(updatePayload);
//       console.log('Booking updated successfully');
      
//       return true;
//     } catch (error) {
//       console.error('Error updating booking:', error);
//       throw error;
//     }
//   }
  
//   // Function to build system prompt based on resident status and property
//   function buildSystemPrompt(residentInfo, propertyCompany) {
//     const basePrompt = `You are Claro, a friendly and relaxed virtual concierge assistant for ${propertyCompany.name}. You're not a stern receptionist or a robotic agent — you're more like a chill, helpful front desk person who just wants to make things easy for the caller. You listen, empathize, and genuinely try to help or direct the person to the right team.
  
//   Your tone is warm, conversational, and unhurried. You let people share what's on their mind and go with the flow. Whether it's a resident calling about a package, a visitor trying to reach a unit, or someone asking about booking amenities — your job is to make them feel heard and taken care of.
  
//   Property Information:
//   - Property: ${propertyCompany.name}
//   - Address: ${propertyCompany.address}
//   - Available amenities: ${propertyCompany.amenities.map(a => a.name).join(', ')}
  
//   Key responsibilities:
//   - For maintenance issues: Acknowledge the issue, say you'll notify the superintendent and management to get someone to fix it ASAP, and mention either you'll notify them with further details or the concierge will give them a call.
//   - For visitor parking passes: Get their license plate and make of car, then say "we've notified the concierge, please go to the front desk to pick up a pass"
//   - For amenity bookings: ONLY residents can book amenities. Non-residents should be directed to visit the front desk or ask a registered resident to help them.
//   - For package inquiries: Check with the front desk about package status
//   - For general building questions: Provide helpful information or direct to appropriate team
//   - Always aim to resolve issues in the fastest way possible
  
//   Keep responses concise but warm. Use text message appropriate language.`;
  
//     if (residentInfo.isResident) {
//       return `${basePrompt}
  
//   RESIDENT INFORMATION:
//   - Name: ${residentInfo.name}
//   - Unit: ${residentInfo.unitNumber}
//   - Always greet residents by their first name when starting conversations (e.g., "Hi ${residentInfo.name}!" or "Hey ${residentInfo.name}!")
//   - You can reference their unit when relevant.
//   - They can book amenities and access all resident services.
//   - When addressing maintenance issues, use their name: "Thanks for letting us know ${residentInfo.name}, I'll notify the superintendent..."`;
//     } else {
//       return `${basePrompt}
  
//   This person is NOT a current resident. Be helpful but do not address them by name since you don't have their information on file. They cannot book amenities or access resident-only services. 
  
//   For non-residents:
//   - Greet them with "Hi there!" or similar generic greeting
//   - They can request visitor parking passes and general building information
//   - For amenity bookings: Direct them to visit the front desk or ask a registered resident to help them
//   - For resident-specific services: Politely explain they need to be a registered resident or visit the front desk`;
//     }
//   }
  
//   // Function to send response via Twilio
//   async function sendTwilioResponse(toPhoneNumber, message, fromPhoneNumber) {
//     try {
//       await twilioClient.messages.create({
//         body: message,
//         from: fromPhoneNumber,
//         to: toPhoneNumber
//       });
//       console.log(`Sent response to ${toPhoneNumber} from ${fromPhoneNumber}`);
//     } catch (error) {
//       console.error('Error sending Twilio message:', error);
//       throw error;
//     }
//   }
  
//   // Optional: Function to get available time slots for an amenity
//   exports.getAvailableSlots = onCall(
//     {},
//     async (request) => {
//       try {
//         const { amenityId, companyId, date } = request.data;
        
//         const startOfDay = new Date(date);
//         startOfDay.setHours(0, 0, 0, 0);
        
//         const endOfDay = new Date(date);
//         endOfDay.setHours(23, 59, 59, 999);
        
//         const bookingsSnapshot = await db.collection('bookings')
//           .where('amenityId', '==', amenityId)
//           .where('companyId', '==', companyId)
//           .where('startDate', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
//           .where('startDate', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
//           .where('status', 'in', ['confirmed', 'pending'])
//           .get();
        
//         const bookedSlots = bookingsSnapshot.docs.map(doc => {
//           const booking = doc.data();
//           return {
//             start: booking.startDate.toDate(),
//             end: booking.endDate.toDate()
//           };
//         });
        
//         return { success: true, bookedSlots };
//       } catch (error) {
//         console.error('Error getting available slots:', error);
//         throw new Error('Failed to get available slots');
//       }
//     }
//   );
  
//   // Optional: Function to get conversation history (for admin dashboard)
//   exports.getConversation = onCall(
//     {},
//     async (request) => {
//       try {
//         const { phoneNumber, companyId } = request.data;
        
//         // Verify authentication (implement your own auth logic)
//         if (!request.auth) {
//           throw new Error('Authentication required');
//         }
        
//         const history = await getConversationHistory(phoneNumber, companyId, 50);
//         return { success: true, conversation: history };
//       } catch (error) {
//         console.error('Error fetching conversation:', error);
//         throw new Error('Failed to fetch conversation');
//       }
//     }
//   );
  
//   // Optional: Function to send manual messages (for admin use)
//   exports.sendManualMessage = onCall(
//     {},
//     async (request) => {
//       try {
//         // Initialize clients
//         initializeClients();
        
//         const { phoneNumber, message, companyId } = request.data;
        
//         // Verify authentication
//         if (!request.auth) {
//           throw new Error('Authentication required');
//         }
        
//         // Get company phone number
//         const company = await db.collection('propertyCompanies').doc(companyId).get();
//         if (!company.exists) {
//           throw new Error('Company not found');
//         }
        
//         const companyData = company.data();
//         await sendTwilioResponse(phoneNumber, message, companyData.companyPhone);
//         await storeMessage(phoneNumber.replace(/^\+1/, ''), message, 'outgoing', null, companyId);
        
//         return { success: true, message: 'Message sent successfully' };
//       } catch (error) {
//         console.error('Error sending manual message:', error);
//         throw new Error('Failed to send message');
//       }
//     }
//   );


const { onRequest, onCall } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Environment Variables
const twilioAccountSid = defineString("TWILIO_ACCOUNT_SID");
const twilioAuthToken = defineString("TWILIO_AUTH_TOKEN");
const openaiApiKey = defineString("OPENAI_API_KEY");

// ✅ 1. Welcome Function
exports.hotelWelcome = onRequest((req, res) => {
  res.status(200).send("Hello from the Hotel Management Project!");
});

// ✅ 2. Basic Test Function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Hotel Management Project!");
});

// ✅ 3. Towel / Guest Service Request Function
exports.handleGuestRequest = functions.https.onRequest(async (req, res) => {
  const { guestId, request, type, timestamp } = req.body;

  if (!guestId || !request || !type) {
    return res.status(400).json({ error: "Missing guestId, request, or type" });
  }

  try {
    const newRequest = {
      guestId,
      request,
      type,
      status: "pending",
      timestamp: timestamp || new Date().toISOString(),
    };

    const docRef = await db.collection("guest_requests").add(newRequest);

    return res.status(200).json({
      message: "Guest request added successfully",
      requestId: docRef.id,
      data: newRequest
    });
  } catch (error) {
    console.error("Error handling guest request:", error);
    return res.status(500).json({ error: "Failed to handle guest request" });
  }
});


// ✅ 4. Parking Status Check
exports.checkParkingStatus = onCall(async (request) => {
  try {
    const { phoneNumber, companyId } = request.data;
    if (!phoneNumber || !companyId) throw new Error('Phone number and company ID are required');

    const residentQuery = await db.collection('residents')
      .where('phone', '==', phoneNumber)
      .where('companyId', '==', companyId)
      .limit(1)
      .get();

    if (residentQuery.empty) {
      return { success: false, message: 'Resident not found' };
    }

    const residentInfo = { id: residentQuery.docs[0].id, ...residentQuery.docs[0].data() };

    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return { success: false, message: 'Company not found' };
    }

    const propertyCompany = { id: companyDoc.id, ...companyDoc.data() };
    const statusMessage = await handleParkingStatus(residentInfo, propertyCompany, db);

    return { success: true, message: statusMessage };

  } catch (error) {
    console.error('Error in checkParkingStatus:', error);
    return { success: false, message: 'Trouble checking parking status.' };
  }
});

// ✅ 5. Send SMS Notification
exports.sendSMSNotification = onCall(async (request) => {
  try {
    const { to, body } = request.data;
    if (!to || !body) throw new Error('Phone number and message body are required');

    const twilio = require('twilio');
    const client = twilio(twilioAccountSid.value(), twilioAuthToken.value());

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    return { success: true, messageSid: message.sid, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, message: 'Failed to send SMS' };
  }
});

// ✅ 6. AI Assistant
exports.aiAssistant = onCall(async (request) => {
  try {
    const { prompt, context } = request.data;
    if (!prompt) throw new Error('Prompt is required');

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: openaiApiKey.value() });

    const systemMessage = context || 'You are a helpful hotel assistant.';

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-3.5-turbo',
      max_tokens: 500
    });

    return {
      success: true,
      response: completion.choices[0].message.content,
      usage: completion.usage
    };

  } catch (error) {
    console.error('AI Assistant Error:', error);
    return { success: false, message: 'AI assistant is unavailable' };
  }
});

// ✅ 7. Hotel Room Booking
exports.createBooking = onCall(async (request) => {
  try {
    const { guestInfo, roomType, checkIn, checkOut, numberOfGuests } = request.data;

    if (!guestInfo || !roomType || !checkIn || !checkOut) {
      throw new Error('Missing booking information');
    }

    const bookingData = {
      guestInfo,
      roomType,
      checkInDate: admin.firestore.Timestamp.fromDate(new Date(checkIn)),
      checkOutDate: admin.firestore.Timestamp.fromDate(new Date(checkOut)),
      numberOfGuests: numberOfGuests || 1,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('bookings').add(bookingData);

    return { success: true, bookingId: docRef.id, message: 'Booking created successfully' };

  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, message: 'Failed to create booking' };
  }
});

console.log("✅ Hotel Management Functions loaded successfully");

// database-service.js
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    getDocs,
    arrayUnion,
    arrayRemove,
    orderBy,
    limit
  } from 'firebase/firestore';
  import { db } from './firebase-config';
  import { auth } from './firebase-config';
  
  class DatabaseService {
    // Company Management
    async createPropertyCompany(companyData) {
      try {
        const companyRef = doc(collection(db, 'propertyCompanies'));
        await setDoc(companyRef, {
          ...companyData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return companyRef.id;
      } catch (error) {
        console.error('Error creating property company:', error);
        throw error;
      }
    }
  
    async getPropertyCompany(companyId) {
      try {
        const companyDoc = await getDoc(doc(db, 'propertyCompanies', companyId));
        return companyDoc.exists() ? { id: companyDoc.id, ...companyDoc.data() } : null;
      } catch (error) {
        console.error('Error getting property company:', error);
        throw error;
      }
    }
  
    // User Profile Management
    async createUserProfile(userId, profileData) {
      try {
        await setDoc(doc(db, 'userProfiles', userId), {
          ...profileData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    }
  
    async getUserProfile(userId) {
      try {
        const userDoc = await getDoc(doc(db, 'userProfiles', userId));
        return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
      } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
      }
    }
  
    async updateUserProfile(userId, updates) {
      try {
        await updateDoc(doc(db, 'userProfiles', userId), {
          ...updates,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    }
  
    // Get company by concierge email
    async getCompanyByEmail(email) {
      try {
        const q = query(
          collection(db, 'propertyCompanies'), 
          where('conciergeEmails', 'array-contains', email)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
        return null;
      } catch (error) {
        console.error('Error getting company by email:', error);
        throw error;
      }
    }
  
    // Resident Management
    async addResident(companyId, residentData) {
      try {
        const residentRef = doc(collection(db, 'residents'));
        await setDoc(residentRef, {
          ...residentData,
          companyId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return residentRef.id;
      } catch (error) {
        console.error('Error adding resident:', error);
        throw error;
      }
    }
  
    async getResidentsByCompany(companyId) {
      try {
        const q = query(
          collection(db, 'residents'), 
          where('companyId', '==', companyId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting residents:', error);
        throw error;
      }
    }
  
    async updateResident(residentId, updates) {
      try {
        await updateDoc(doc(db, 'residents', residentId), {
          ...updates,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating resident:', error);
        throw error;
      }
    }
  
    async deleteResident(residentId) {
      try {
        await deleteDoc(doc(db, 'residents', residentId));
      } catch (error) {
        console.error('Error deleting resident:', error);
        throw error;
      }
    }
  
    // Calendar/Booking Management
    async createBooking(companyId, bookingData) {
      try {
        const bookingRef = doc(collection(db, 'bookings'));
        await setDoc(bookingRef, {
          ...bookingData,
          companyId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return bookingRef.id;
      } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
      }
    }
  
    async getBookingsByCompany(companyId, startDate = null, endDate = null) {
      try {
        let q = query(
          collection(db, 'bookings'), 
          where('companyId', '==', companyId)
        );
        
        // Add date filtering if provided
        if (startDate) {
          q = query(q, where('startDate', '>=', startDate));
        }
        if (endDate) {
          q = query(q, where('endDate', '<=', endDate));
        }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting bookings:', error);
        throw error;
      }
    }
  
    async updateBooking(bookingId, updates) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          ...updates,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating booking:', error);
        throw error;
      }
    }
  
    async deleteBooking(bookingId) {
      try {
        await deleteDoc(doc(db, 'bookings', bookingId));
      } catch (error) {
        console.error('Error deleting booking:', error);
        throw error;
      }
    }
  
    // Issues/Messages Management
    async createIssue(companyId, issueData) {
      try {
        const issueRef = doc(collection(db, 'issues'));
        await setDoc(issueRef, {
          ...issueData,
          companyId,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return issueRef.id;
      } catch (error) {
        console.error('Error creating issue:', error);
        throw error;
      }
    }
  
    async getIssuesByCompany(companyId) {
      try {
        const q = query(
          collection(db, 'issues'), 
          where('companyId', '==', companyId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting issues:', error);
        throw error;
      }
    }
  
    async updateIssue(issueId, updates) {
      try {
        await updateDoc(doc(db, 'issues', issueId), {
          ...updates,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating issue:', error);
        throw error;
      }
    }

// Visitor Management
async createVisitor(companyId, visitorData) {
    try {
      const visitorRef = doc(collection(db, 'visitors'));
      await setDoc(visitorRef, {
        ...visitorData,
        companyId,
        status: 'pre_registered',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return visitorRef.id;
    } catch (error) {
      console.error('Error creating visitor:', error);
      throw error;
    }
  }
  
  async getVisitorsByCompany(companyId, startDate = null, endDate = null) {
    try {
      let q = query(
        collection(db, 'visitors'), 
        where('companyId', '==', companyId)
      );
      
      // Add date filtering if provided
      if (startDate) {
        q = query(q, where('expectedArrival', '>=', startDate));
      }
      if (endDate) {
        q = query(q, where('expectedArrival', '<=', endDate));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting visitors:', error);
      throw error;
    }
  }
  
  async updateVisitor(visitorId, updates) {
    try {
      await updateDoc(doc(db, 'visitors', visitorId), {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating visitor:', error);
      throw error;
    }
  }
  
  async deleteVisitor(visitorId) {
    try {
      await deleteDoc(doc(db, 'visitors', visitorId));
    } catch (error) {
      console.error('Error deleting visitor:', error);
      throw error;
    }
  }
  
  // Parking Request Management
  async createParkingRequest(companyId, requestData) {
    try {
      const requestRef = doc(collection(db, 'parkingRequests'));
      await setDoc(requestRef, {
        ...requestData,
        companyId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return requestRef.id;
    } catch (error) {
      console.error('Error creating parking request:', error);
      throw error;
    }
  }
  
  async getParkingRequestsByCompany(companyId, startDate = null, endDate = null) {
    try {
      let q = query(
        collection(db, 'parkingRequests'), 
        where('companyId', '==', companyId)
      );
      
      // Add date filtering if provided
      if (startDate) {
        q = query(q, where('requestedDate', '>=', startDate));
      }
      if (endDate) {
        q = query(q, where('requestedDate', '<=', endDate));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting parking requests:', error);
      throw error;
    }
  }
  
  async updateParkingRequest(requestId, updates) {
    try {
      await updateDoc(doc(db, 'parkingRequests', requestId), {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating parking request:', error);
      throw error;
    }
  }
  
  async deleteParkingRequest(requestId) {
    try {
      await deleteDoc(doc(db, 'parkingRequests', requestId));
    } catch (error) {
      console.error('Error deleting parking request:', error);
      throw error;
    }
  }
  
  // Get visitors checked in today
  async getTodaysCheckedInVisitors(companyId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const q = query(
        collection(db, 'visitors'),
        where('companyId', '==', companyId),
        where('status', '==', 'checked_in'),
        where('actualArrival', '>=', today),
        where('actualArrival', '<', tomorrow)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting today\'s checked in visitors:', error);
      throw error;
    }
  }
  
  // Get pending parking requests
  async getPendingParkingRequests(companyId) {
    try {
      const q = query(
        collection(db, 'parkingRequests'),
        where('companyId', '==', companyId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting pending parking requests:', error);
      throw error;
    }
  }

// Messages & Call Logs Management
async createMessage(companyId, messageData) {
    try {
      const messageRef = doc(collection(db, 'messages'));
      await setDoc(messageRef, {
        ...messageData,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return messageRef.id;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }
  
  async getMessagesByCompany(companyId) {
    try {
      const q = query(
        collection(db, 'messages'), 
        where('companyId', '==', companyId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
  
  async markMessageAsRead(messageId) {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
  
  async createCallLog(companyId, callData) {
    try {
      const callRef = doc(collection(db, 'callLogs'));
      await setDoc(callRef, {
        ...callData,
        companyId,
        type: 'call',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return callRef.id;
    } catch (error) {
      console.error('Error creating call log:', error);
      throw error;
    }
  }
  
  async getCallLogsByCompany(companyId) {
    try {
      const q = query(
        collection(db, 'callLogs'), 
        where('companyId', '==', companyId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting call logs:', error);
      throw error;
    }
  }
  
  async updateCallLog(callId, updates) {
    try {
      await updateDoc(doc(db, 'callLogs', callId), {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating call log:', error);
      throw error;
    }
  }
  
  // Auto-associate messages/calls with residents based on phone number
  async associateContactWithResident(companyId, phoneNumber) {
    try {
      const residentsQuery = query(
        collection(db, 'residents'),
        where('companyId', '==', companyId),
        where('phone', '==', phoneNumber)
      );
      
      const querySnapshot = await getDocs(residentsQuery);
      
      if (!querySnapshot.empty) {
        const resident = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        return {
          residentId: resident.id,
          residentName: resident.name,
          unitNumber: resident.unitNumber
        };
      }
      
      return null; // No resident found for this number
    } catch (error) {
      console.error('Error associating contact with resident:', error);
      return null;
    }
  }
  
  // Get conversation thread between concierge and a specific phone number
  async getConversationThread(companyId, phoneNumber) {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('companyId', '==', companyId),
        where('phoneNumber', '==', phoneNumber)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting conversation thread:', error);
      throw error;
    }
  }
  
  // Analytics and summary methods
  async getMessageStats(companyId, dateRange = null) {
    try {
      let q = query(
        collection(db, 'messages'),
        where('companyId', '==', companyId)
      );
      
      if (dateRange) {
        q = query(q, 
          where('timestamp', '>=', dateRange.start),
          where('timestamp', '<=', dateRange.end)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        total: messages.length,
        incoming: messages.filter(m => m.direction === 'incoming').length,
        outgoing: messages.filter(m => m.direction === 'outgoing').length,
        unread: messages.filter(m => !m.isRead && m.direction === 'incoming').length,
        avgResponseTime: this.calculateAverageResponseTime(messages)
      };
    } catch (error) {
      console.error('Error getting message stats:', error);
      throw error;
    }
  }
  
  async getCallStats(companyId, dateRange = null) {
    try {
      let q = query(
        collection(db, 'callLogs'),
        where('companyId', '==', companyId)
      );
      
      if (dateRange) {
        q = query(q, 
          where('timestamp', '>=', dateRange.start),
          where('timestamp', '<=', dateRange.end)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const calls = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        total: calls.length,
        answered: calls.filter(c => c.status === 'answered').length,
        missed: calls.filter(c => c.status === 'missed').length,
        avgDuration: this.calculateAverageDuration(calls.filter(c => c.duration))
      };
    } catch (error) {
      console.error('Error getting call stats:', error);
      throw error;
    }
  }
  
  // Helper function to calculate average response time
  calculateAverageResponseTime(messages) {
    const conversations = {};
    
    // Group messages by phone number
    messages.forEach(message => {
      if (!conversations[message.phoneNumber]) {
        conversations[message.phoneNumber] = [];
      }
      conversations[message.phoneNumber].push(message);
    });
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    // Calculate response times for each conversation
    Object.values(conversations).forEach(conversation => {
      for (let i = 0; i < conversation.length - 1; i++) {
        const current = conversation[i];
        const next = conversation[i + 1];
        
        // If incoming message followed by outgoing message
        if (current.direction === 'incoming' && next.direction === 'outgoing') {
          const responseTime = new Date(next.timestamp) - new Date(current.timestamp);
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });
    
    return responseCount > 0 ? Math.round(totalResponseTime / responseCount / (1000 * 60)) : 0; // Return in minutes
  }
  
  // Helper function to calculate average call duration
  calculateAverageDuration(calls) {
    if (calls.length === 0) return 0;
    
    const totalDuration = calls.reduce((sum, call) => {
      // Assuming duration is in seconds
      const duration = typeof call.duration === 'string' ? 
        this.parseDurationString(call.duration) : call.duration;
      return sum + (duration || 0);
    }, 0);
    
    return Math.round(totalDuration / calls.length);
  }
  
  // Helper function to parse duration strings like "2:30" into seconds
  parseDurationString(durationStr) {
    if (!durationStr) return 0;
    
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return (minutes * 60) + seconds;
    }
    
    return parseInt(durationStr) || 0;
  }
  
  // Twilio Integration Helpers (for when you implement Twilio)
  async logIncomingMessage(companyId, twilioData) {
    try {
      // Associate with resident if possible
      const residentInfo = await this.associateContactWithResident(companyId, twilioData.From);
      
      const messageData = {
        phoneNumber: twilioData.From,
        content: twilioData.Body,
        direction: 'incoming',
        type: 'sms',
        status: 'received',
        timestamp: new Date(),
        isRead: false,
        twilioSid: twilioData.MessageSid,
        ...residentInfo
      };
      
      return await this.createMessage(companyId, messageData);
    } catch (error) {
      console.error('Error logging incoming message:', error);
      throw error;
    }
  }
  
  async logOutgoingMessage(companyId, messageData, twilioResponse) {
    try {
      const messageRecord = {
        ...messageData,
        direction: 'outgoing',
        type: 'sms',
        status: twilioResponse.status || 'sent',
        timestamp: new Date(),
        isRead: true,
        twilioSid: twilioResponse.sid,
        sentBy: auth.currentUser?.email
      };
      
      return await this.createMessage(companyId, messageRecord);
    } catch (error) {
      console.error('Error logging outgoing message:', error);
      throw error;
    }
  }
  
  async logIncomingCall(companyId, retellData) {
    try {
      // Associate with resident if possible
      const residentInfo = await this.associateContactWithResident(companyId, retellData.from);
      
      const callData = {
        phoneNumber: retellData.from,
        status: retellData.status || 'answered',
        duration: retellData.duration,
        timestamp: new Date(retellData.timestamp),
        isRead: false,
        summary: retellData.summary,
        aiSummary: retellData.ai_summary,
        transcription: retellData.transcription,
        retellCallId: retellData.call_id,
        ...residentInfo
      };
      
      return await this.createCallLog(companyId, callData);
    } catch (error) {
      console.error('Error logging incoming call:', error);
      throw error;
    }
  }
  
  // Search functionality
  async searchMessagesAndCalls(companyId, searchTerm) {
    try {
      const [messages, calls] = await Promise.all([
        this.getMessagesByCompany(companyId),
        this.getCallLogsByCompany(companyId)
      ]);
      
      const searchLower = searchTerm.toLowerCase();
      
      const filteredMessages = messages.filter(message => 
        message.phoneNumber?.toLowerCase().includes(searchLower) ||
        message.residentName?.toLowerCase().includes(searchLower) ||
        message.unitNumber?.toLowerCase().includes(searchLower) ||
        message.content?.toLowerCase().includes(searchLower)
      );
      
      const filteredCalls = calls.filter(call => 
        call.phoneNumber?.toLowerCase().includes(searchLower) ||
        call.residentName?.toLowerCase().includes(searchLower) ||
        call.unitNumber?.toLowerCase().includes(searchLower) ||
        call.summary?.toLowerCase().includes(searchLower) ||
        call.aiSummary?.toLowerCase().includes(searchLower)
      );
      
      return {
        messages: filteredMessages,
        calls: filteredCalls,
        total: filteredMessages.length + filteredCalls.length
      };
    } catch (error) {
      console.error('Error searching messages and calls:', error);
      throw error;
    }
  }
  
  // Bulk operations
  async markAllMessagesAsRead(companyId, phoneNumber = null) {
    try {
      let q = query(
        collection(db, 'messages'),
        where('companyId', '==', companyId),
        where('isRead', '==', false),
        where('direction', '==', 'incoming')
      );
      
      if (phoneNumber) {
        q = query(q, where('phoneNumber', '==', phoneNumber));
      }
      
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      return querySnapshot.docs.length;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Package Management
async createPackage(companyId, packageData) {
    try {
      const packageRef = doc(collection(db, 'packages'));
      await setDoc(packageRef, {
        ...packageData,
        companyId,
        status: 'pending',
        notificationSent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return packageRef.id;
    } catch (error) {
      console.error('Error creating package:', error);
      throw error;
    }
  }
  
  async getPackagesByCompany(companyId) {
    try {
      const q = query(
        collection(db, 'packages'), 
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting packages:', error);
      throw error;
    }
  }
  
  async updatePackage(packageId, updates) {
    try {
      await updateDoc(doc(db, 'packages', packageId), {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  }
  
  async deletePackage(packageId) {
    try {
      await deleteDoc(doc(db, 'packages', packageId));
    } catch (error) {
      console.error('Error deleting package:', error);
      throw error;
    }
  }
  
  async markPackageAsPickedUp(packageId, pickupData) {
    try {
      await updateDoc(doc(db, 'packages', packageId), {
        status: 'picked_up',
        pickupBy: pickupData.pickupBy || 'Resident',
        pickedUpAt: new Date(),
        pickupNotes: pickupData.notes || '',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking package as picked up:', error);
      throw error;
    }
  }
  
  async markPackageAsNotified(packageId, notificationData) {
    try {
      await updateDoc(doc(db, 'packages', packageId), {
        notificationSent: true,
        notificationMethod: notificationData.method || 'sms',
        notificationSentAt: new Date(),
        notificationContent: notificationData.content || '',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking package as notified:', error);
      throw error;
    }
  }
  
  // Package Statistics
  async getPackageStats(companyId, dateRange = null) {
    try {
      let q = query(
        collection(db, 'packages'),
        where('companyId', '==', companyId)
      );
      
      if (dateRange) {
        q = query(q, 
          where('createdAt', '>=', dateRange.start),
          where('createdAt', '<=', dateRange.end)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const packages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        total: packages.length,
        pending: packages.filter(p => p.status === 'pending').length,
        pickedUp: packages.filter(p => p.status === 'picked_up').length,
        notified: packages.filter(p => p.notificationSent).length,
        avgPickupTime: this.calculateAveragePickupTime(packages),
        topCouriers: this.getTopCouriers(packages)
      };
    } catch (error) {
      console.error('Error getting package stats:', error);
      throw error;
    }
  }
  
  // Helper function to calculate average pickup time
  calculateAveragePickupTime(packages) {
    const pickedUpPackages = packages.filter(p => p.status === 'picked_up' && p.pickedUpAt && p.createdAt);
    
    if (pickedUpPackages.length === 0) return 0;
    
    const totalTime = pickedUpPackages.reduce((sum, pkg) => {
      const createdAt = pkg.createdAt.toDate ? pkg.createdAt.toDate() : new Date(pkg.createdAt);
      const pickedUpAt = pkg.pickedUpAt.toDate ? pkg.pickedUpAt.toDate() : new Date(pkg.pickedUpAt);
      return sum + (pickedUpAt - createdAt);
    }, 0);
    
    return Math.round(totalTime / pickedUpPackages.length / (1000 * 60 * 60)); // Return in hours
  }
  
  // Helper function to get top couriers
  getTopCouriers(packages) {
    const courierCounts = {};
    
    packages.forEach(pkg => {
      if (pkg.courier) {
        courierCounts[pkg.courier] = (courierCounts[pkg.courier] || 0) + 1;
      }
    });
    
    return Object.entries(courierCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([courier, count]) => ({ courier, count }));
  }
  
  // Search packages
  async searchPackages(companyId, searchTerm) {
    try {
      const packages = await this.getPackagesByCompany(companyId);
      
      const searchLower = searchTerm.toLowerCase();
      
      return packages.filter(pkg => 
        pkg.residentName?.toLowerCase().includes(searchLower) ||
        pkg.unitNumber?.toLowerCase().includes(searchLower) ||
        pkg.courier?.toLowerCase().includes(searchLower) ||
        pkg.trackingNumber?.toLowerCase().includes(searchLower) ||
        pkg.description?.toLowerCase().includes(searchLower) ||
        pkg.recipientEmail?.toLowerCase().includes(searchLower) ||
        pkg.recipientPhone?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching packages:', error);
      throw error;
    }
  }
  
  // Package notifications integration
  async sendPackageNotification(packageId, residentId, notificationType = 'arrival') {
    try {
      const pkg = await this.getPackage(packageId);
      const resident = await this.getResident(residentId);
      
      if (!pkg || !resident) {
        throw new Error('Package or resident not found');
      }
      
      let messageContent;
      
      switch (notificationType) {
        case 'arrival':
          messageContent = `Hi ${resident.name}! A package from ${pkg.courier} has arrived at the front desk for Unit ${pkg.unitNumber}. Please pick it up during business hours. Tracking: ${pkg.trackingNumber || 'N/A'}. Building Management.`;
          break;
        case 'reminder':
          messageContent = `Reminder: You have a package waiting at the front desk for pickup. Unit ${pkg.unitNumber}. Please collect it during business hours. Building Management.`;
          break;
        case 'final_notice':
          messageContent = `FINAL NOTICE: Your package has been waiting for pickup for several days. Unit ${pkg.unitNumber}. Please collect it immediately or contact building management. Building Management.`;
          break;
        default:
          messageContent = `Package notification for Unit ${pkg.unitNumber}. Please contact building management for details.`;
      }
      
      // This would integrate with your Twilio SMS service
      console.log('Sending package notification:', {
        to: resident.phone,
        message: messageContent,
        packageId,
        type: notificationType
      });
      
      // Mark package as notified
      await this.markPackageAsNotified(packageId, {
        method: 'sms',
        content: messageContent
      });
      
      // Log the notification
      await this.logActivity(pkg.companyId, {
        type: 'package_notification',
        description: `Package notification sent to ${resident.name} (Unit ${pkg.unitNumber})`,
        packageId,
        residentId,
        notificationType
      });
      
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Error sending package notification:', error);
      throw error;
    }
  }
  
  // Get individual package
  async getPackage(packageId) {
    try {
      const packageDoc = await getDoc(doc(db, 'packages', packageId));
      return packageDoc.exists() ? { id: packageDoc.id, ...packageDoc.data() } : null;
    } catch (error) {
      console.error('Error getting package:', error);
      throw error;
    }
  }
  
  // Bulk operations for packages
  async markMultiplePackagesAsPickedUp(packageIds, pickupData) {
    try {
      const updatePromises = packageIds.map(packageId => 
        this.markPackageAsPickedUp(packageId, pickupData)
      );
      
      await Promise.all(updatePromises);
      return packageIds.length;
    } catch (error) {
      console.error('Error marking multiple packages as picked up:', error);
      throw error;
    }
  }
  
  async sendBulkPackageNotifications(packageIds, notificationType = 'arrival') {
    try {
      const notificationPromises = packageIds.map(async (packageId) => {
        const pkg = await this.getPackage(packageId);
        if (pkg && pkg.residentId) {
          return this.sendPackageNotification(packageId, pkg.residentId, notificationType);
        }
      });
      
      const results = await Promise.all(notificationPromises);
      return results.filter(result => result?.success).length;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }
  
  // Package reports
  async generatePackageReport(companyId, dateRange) {
    try {
      const packages = await this.getPackagesByCompany(companyId);
      const filteredPackages = packages.filter(pkg => {
        const pkgDate = pkg.createdAt.toDate ? pkg.createdAt.toDate() : new Date(pkg.createdAt);
        return pkgDate >= dateRange.start && pkgDate <= dateRange.end;
      });
      
      const stats = await this.getPackageStats(companyId, dateRange);
      
      return {
        period: {
          start: dateRange.start,
          end: dateRange.end
        },
        summary: stats,
        packages: filteredPackages,
        insights: {
          busiestDay: this.getBusiestDay(filteredPackages),
          mostActiveUnit: this.getMostActiveUnit(filteredPackages),
          averagePackagesPerDay: Math.round(filteredPackages.length / this.getDaysBetween(dateRange.start, dateRange.end))
        }
      };
    } catch (error) {
      console.error('Error generating package report:', error);
      throw error;
    }
  }
  
  // Helper functions for reports
  getBusiestDay(packages) {
    const dayCounts = {};
    
    packages.forEach(pkg => {
      const date = pkg.createdAt.toDate ? pkg.createdAt.toDate() : new Date(pkg.createdAt);
      const dayKey = date.toDateString();
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
    });
    
    const busiestDay = Object.entries(dayCounts).reduce((max, [day, count]) => 
      count > max.count ? { day, count } : max, { day: null, count: 0 });
    
    return busiestDay;
  }
  
  getMostActiveUnit(packages) {
    const unitCounts = {};
    
    packages.forEach(pkg => {
      if (pkg.unitNumber) {
        unitCounts[pkg.unitNumber] = (unitCounts[pkg.unitNumber] || 0) + 1;
      }
    });
    
    const mostActiveUnit = Object.entries(unitCounts).reduce((max, [unit, count]) => 
      count > max.count ? { unit, count } : max, { unit: null, count: 0 });
    
    return mostActiveUnit;
  }
  
  getDaysBetween(startDate, endDate) {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  }
  
  export const dbService = new DatabaseService();
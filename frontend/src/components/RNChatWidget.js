import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Keyboard
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import faqData from "../data/faq.json";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function RNChatWidget({ isLoggedIn = false, user = null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const STORAGE_KEY = user && user.id 
  ? `aqrov2_chat_user_${user.id}` 
  : "aqrov2_guest_chat_history";

  /* ------------------------------------------------------
     LOAD HISTORY ON MOUNT
  ------------------------------------------------------ */
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      if (parsed && Array.isArray(parsed)) {
        setMessages(parsed);
      } else {
        const greeting = {
          from: "ai",
          text: "Hi! I'm AQRO Assistant. Ask me about login, registration, or how to use the platform.",
          timestamp: new Date().toISOString()
        };
        setMessages([greeting]);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([greeting]));
      }
    } catch (err) {
      console.log("Failed to load history", err);
    }
  }

  async function saveMessages(arr) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  /* ------------------------------------------------------
     FAQ MATCHING LOGIC
  ------------------------------------------------------ */
  function matchFAQ(message) {
    const text = message.toLowerCase();
    let best = null;
    let bestScore = 0;

    for (const item of faqData) {
      let score = 0;
      for (const kw of item.keywords) {
        if (text.includes(kw.toLowerCase())) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (bestScore >= 1) return best.reply;
    return "I can help with login and registration. Please log in to ask broader questions.";
  }

  /* ------------------------------------------------------
     SEND MESSAGE
  ------------------------------------------------------ */
  async function sendMessage() {
  const trimmed = input.trim();
  if (!trimmed) return;

  const userMsg = {
    from: "user",
    text: trimmed,
    timestamp: new Date().toISOString()
  };

  const next = [...messages, userMsg];
  setMessages(next);
  saveMessages(next);
  setInput("");
  Keyboard.dismiss();

  setTyping(true);

  /* --------------------------------------------------
     IF LOGGED IN → USE N8N AI REPLY
  -------------------------------------------------- */
  if (isLoggedIn && user) {
    try {
      const response = await fetch("https://nonaxiomatic-delana-caritative.ngrok-free.dev/webhook/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: user.token ? `Bearer ${user.token}` : undefined,
        },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          email: user.email,
          message: trimmed,
          source: "mobile-app",
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      // The text returned by your n8n Respond node
      const botReply =
      data.sendToChatWidget?.message ||
      data.reply ||
      data.response ||
      data.message ||
      "No reply received.";

      const botMsg = {
        from: "ai",
        text: botReply,
        timestamp: new Date().toISOString()
      };

      const updated = [...next, botMsg];
      setMessages(updated);
      saveMessages(updated);
      setTyping(false);
      return; // ⬅ stop here, DO NOT run the FAQ fallback
    }
    catch (err) {
      console.log("N8N error:", err);
    }
  }

  /* --------------------------------------------------
     GUEST USERS → USE LOCAL FAQ
  -------------------------------------------------- */
  setTimeout(() => {
    const replyText = matchFAQ(trimmed);
    const botMsg = {
      from: "ai",
      text: replyText,
      timestamp: new Date().toISOString()
    };

    const updated = [...next, botMsg];
    setMessages(updated);
    saveMessages(updated);
    setTyping(false);
  }, 600);
}


  /* ------------------------------------------------------
     RENDER A MESSAGE BUBBLE
  ------------------------------------------------------ */
  function renderMessage({ item }) {
    const isUser = item.from === "user";
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.msgUser : styles.msgBot
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot
          ]}
        >
          <Text style={{ color: isUser ? "#fff" : "#222" }}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </View>
    );
  }

  /* ------------------------------------------------------
     TOGGLE CHAT OPEN/CLOSE
  ------------------------------------------------------ */
  const toggleChat = () => {
    setOpen(!open);
  };

  /* ------------------------------------------------------
     UI
  ------------------------------------------------------ */
  return (
    <>
      {/* Floating Bubble */}
      {!open && (
        <TouchableOpacity style={styles.floatingButton} onPress={toggleChat}>
          <Text style={styles.floatingIcon}>💬</Text>
        </TouchableOpacity>
      )}

      {/* Full Screen Chat */}
      {open && (
        <SafeAreaView style={styles.fullScreenContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* Header */}
            <View style={styles.headerFull}>
              <Text style={styles.headerText}>
                AQRO Assistant{" "}
                <Text style={styles.statusSmall}>
                  {isLoggedIn ? "(logged in)" : "(guest)"}
                </Text>
              </Text>
              <TouchableOpacity onPress={toggleChat}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, idx) => String(idx)}
              contentContainerStyle={{ padding: 10, paddingBottom: 10 }}
              keyboardShouldPersistTaps="handled"
            />

            {typing && (
              <View style={[styles.messageRow, styles.msgBot]}>
                <View style={styles.typingBubble}>
                  <Text>Typing...</Text>
                </View>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={{ color: "#fff" }}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </>
  );
}

/* ------------------------------------------------------
   STYLES
------------------------------------------------------ */
const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    backgroundColor: "#2b8aed",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { height: 2 },
    zIndex: 999999
  },
  floatingIcon: {
    fontSize: 28,
    color: "#fff"
  },

  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#fff"
  },

  headerFull: {
    backgroundColor: "#2b8aed",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18
  },
  statusSmall: {
    fontSize: 12,
    color: "#eee"
  },
  closeBtn: {
    color: "#fff",
    fontSize: 22
  },

  messageRow: {
    marginBottom: 10,
    flexDirection: "row"
  },
  msgUser: { justifyContent: "flex-end" },
  msgBot: { justifyContent: "flex-start" },

  bubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 16
  },
  bubbleUser: {
    backgroundColor: "#2b8aed",
    borderBottomRightRadius: 4
  },
  bubbleBot: {
    backgroundColor: "#f2f2f2",
    borderBottomLeftRadius: 4
  },
  timestamp: {
    marginTop: 4,
    fontSize: 10,
    color: "#777",
    alignSelf: "flex-end"
  },

  typingBubble: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 14,
    maxWidth: "55%"
  },

  footer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff"
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  sendBtn: {
    backgroundColor: "#2b8aed",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center"
  }
});

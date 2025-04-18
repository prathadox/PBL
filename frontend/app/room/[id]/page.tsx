"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/lib/auth"
import { getRoomData } from "@/lib/api"
import { useSocket, joinRoom, sendCodeChange, onCodeChange, onInitialCode } from "@/lib/socket"
import dynamic from "next/dynamic"
import { Button } from "@/codecollab/app/components/ui/button"
import { Input } from "@/codecollab/app/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/codecollab/app/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/codecollab/app/components/ui/avatar"
import { Slider } from "@/codecollab/app/components/ui/slider"
import {
  ArrowLeft,
  Send,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Zap,
  Copy,
  Users,
  Plus,
  Search,
  PlayCircle,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/codecollab/app/components/ui/dialog"

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

// Mock data
const MOCK_USERS = [
  { id: 1, name: "Alex Johnson", avatar: "/placeholder.svg?height=40&width=40", online: true },
  { id: 2, name: "Sarah Chen", avatar: "/placeholder.svg?height=40&width=40", online: true },
  { id: 3, name: "Michael Rodriguez", avatar: "/placeholder.svg?height=40&width=40", online: false },
]

const MOCK_CHAT_MESSAGES = [
  { id: 1, userId: 1, text: "Hey team, I'm working on the authentication module.", timestamp: "10:30 AM" },
  { id: 2, userId: 2, text: "Great! I'll focus on the UI components then.", timestamp: "10:32 AM" },
  { id: 3, userId: 1, text: "Let me know if you need any help with the API integration.", timestamp: "10:35 AM" },
  { id: 4, userId: 3, text: "I just pushed some updates to the database schema.", timestamp: "10:40 AM" },
  { id: 5, userId: 2, text: "Looks good! I'll update my components to match.", timestamp: "10:42 AM" },
]

const MOCK_SONGS = [
  { id: 1, title: "Coding Focus", artist: "Lo-Fi Beats", cover: "/placeholder.svg?height=60&width=60", duration: 183 },
  {
    id: 2,
    title: "Deep Concentration",
    artist: "Ambient Sounds",
    cover: "/placeholder.svg?height=60&width=60",
    duration: 240,
  },
  { id: 3, title: "Productivity Mix", artist: "Chillhop", cover: "/placeholder.svg?height=60&width=60", duration: 195 },
  {
    id: 4,
    title: "Coding Rhythm",
    artist: "Electronic Vibes",
    cover: "/placeholder.svg?height=60&width=60",
    duration: 210,
  },
  {
    id: 5,
    title: "Late Night Coding",
    artist: "Synthwave",
    cover: "/placeholder.svg?height=60&width=60",
    duration: 225,
  },
]

// Additional songs for the "Add More Music" feature
const ADDITIONAL_SONGS = [
  { id: 6, title: "Focus Flow", artist: "Ambient Works", cover: "/placeholder.svg?height=60&width=60", duration: 245 },
  { id: 7, title: "Deep Work", artist: "Study Beats", cover: "/placeholder.svg?height=60&width=60", duration: 198 },
  { id: 8, title: "Coding Jazz", artist: "Smooth Vibes", cover: "/placeholder.svg?height=60&width=60", duration: 220 },
  { id: 9, title: "Night Coding", artist: "Chill Hop", cover: "/placeholder.svg?height=60&width=60", duration: 205 },
  {
    id: 10,
    title: "Algorithm Beats",
    artist: "Tech Sounds",
    cover: "/placeholder.svg?height=60&width=60",
    duration: 230,
  },
]

const INITIAL_CODE = `// Welcome to Code-Collab!
// Start coding together in real-time.

function greet(name) {
  return "Hello, " + name + "!";
}

// Try the AI Enhancer to improve this code
console.log(greet("World"));
`

const ENHANCED_CODE = `// Welcome to Code-Collab!
// Start coding together in real-time.

/**
 * Greets a user with a personalized message
 * @param {string} name - The name to greet
 * @returns {string} - The greeting message
 */
function greet(name) {
  // Handle edge cases
  if (!name || typeof name !== 'string') {
    return "Hello, friend!";
  }
  
  // Return the greeting with proper string interpolation
  return \`Hello, \${name}!\`;
}

// Try the AI Enhancer to improve this code
console.log(greet("World"));
`

export default function RoomPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const socket = useSocket()
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [roomData, setRoomData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessage, setChatMessage] = useState("")
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES)
  const [currentSong, setCurrentSong] = useState(MOCK_SONGS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([70])
  const [currentTime, setCurrentTime] = useState(0)
  const [enhancedCode, setEnhancedCode] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [playlist, setPlaylist] = useState(MOCK_SONGS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<Array<{ type: string; content: string }>>([])
  const [isRunning, setIsRunning] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const data = await getRoomData(id as string)
        setRoomData(data)
        if (data.code) {
          setCode(data.code)
        }
        if (data.language) {
          setLanguage(data.language)
        }
      } catch (error) {
        console.error("Error fetching room data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoomData()
  }, [id])

  useEffect(() => {
    if (socket && user) {
      joinRoom(id as string, user.id, user.email)

      onInitialCode((initialCode, initialLanguage) => {
        setCode(initialCode)
        setLanguage(initialLanguage)
      })

      onCodeChange((newCode, newLanguage) => {
        setCode(newCode)
        setLanguage(newLanguage)
      })
    }
  }, [socket, user, id])

  // Scroll to bottom of chat when new messages are added
  // Scroll to bottom of terminal when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalOutput])

  // Simulate song progress
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying && currentTime < currentSong.duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentSong.duration) {
            clearInterval(interval)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isPlaying, currentTime, currentSong.duration])

  // Simulate typing indicator
  useEffect(() => {
    if (chatMessage.length > 0) {
      setIsTyping(true)
    } else {
      setIsTyping(false)
    }
  }, [chatMessage])

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setCode(value)
      // Reset enhanced code state when user makes changes
      if (enhancedCode) {
        setEnhancedCode(false)
      }
    }
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        userId: 1, // Current user
        text: chatMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages([...messages, newMessage])
      setChatMessage("")
    }
  }

  const handleEnhanceCode = () => {
    // Simulate AI enhancement with loading state
    setIsEnhancing(true)

    setTimeout(() => {
      setCode(ENHANCED_CODE)
      setEnhancedCode(true)
      setIsEnhancing(false)

      toast({
        title: "Code Enhanced",
        description: "AI has improved your code with better practices and documentation.",
      })
    }, 1500)
  }

  const handleRunCode = () => {
    setIsRunning(true)
    setTerminalOutput((prev) => [...prev, { type: "info", content: "> Running code..." }])

    // Simulate code execution
    setTimeout(() => {
      try {
        // For JavaScript, we can actually try to evaluate the code
        if (language === "javascript") {
          // Create a safe evaluation environment
          const consoleLog = (output: any) => {
            setTerminalOutput((prev) => [
              ...prev,
              {
                type: "success",
                content: typeof output === "object" ? JSON.stringify(output) : String(output),
              },
            ])
          }

          // Replace console.log with our custom function
          const codeToEval = code.replace(/console\.log\(/g, "consoleLog(")

          // Try to evaluate the code
          try {
            // eslint-disable-next-line no-new-func
            new Function("consoleLog", codeToEval)(consoleLog)
            setTerminalOutput((prev) => [...prev, { type: "info", content: "> Code executed successfully" }])
          } catch (error) {
            if (error instanceof Error) {
              setTerminalOutput((prev) => [...prev, { type: "error", content: `Error: ${error.message}` }])
            }
          }
        } else {
          // For other languages, just simulate output
          if (code.includes("print") || code.includes("console.log") || code.includes("echo")) {
            setTerminalOutput((prev) => [...prev, { type: "success", content: "Hello, World!" }])
          }
          setTerminalOutput((prev) => [...prev, { type: "info", content: "> Code executed successfully" }])
        }
      } catch (error) {
        if (error instanceof Error) {
          setTerminalOutput((prev) => [...prev, { type: "error", content: `Error: ${error.message}` }])
        }
      } finally {
        setIsRunning(false)
      }
    }, 1000)
  }

  const handleClearTerminal = () => {
    setTerminalOutput([])
  }

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(id)
    toast({
      title: "Room ID Copied",
      description: "Room ID has been copied to clipboard.",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleNextSong = () => {
    const currentIndex = playlist.findIndex((song) => song.id === currentSong.id)
    const nextIndex = (currentIndex + 1) % playlist.length
    setCurrentSong(playlist[nextIndex])
    setCurrentTime(0)
  }

  const handlePrevSong = () => {
    const currentIndex = playlist.findIndex((song) => song.id === currentSong.id)
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length
    setCurrentSong(playlist[prevIndex])
    setCurrentTime(0)
  }

  const handleAddSong = (song: (typeof ADDITIONAL_SONGS)[0]) => {
    if (!playlist.some((s) => s.id === song.id)) {
      setPlaylist([...playlist, song])
      toast({
        title: "Song Added",
        description: `"${song.title}" by ${song.artist} has been added to your playlist.`,
      })
    } else {
      toast({
        title: "Song Already in Playlist",
        description: `"${song.title}" is already in your playlist.`,
      })
    }
  }

  const filteredAdditionalSongs = ADDITIONAL_SONGS.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">Room: {id}</h1>
              <p className="text-gray-600">Welcome, {user?.email}</p>
            </div>

            <div className="mb-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div className="h-[500px] border rounded-lg overflow-hidden">
              <MonacoEditor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = 'http://your-server-ip:8000'

export default function App() {
  const [pending, setPending] = useState([])

  const fetchPending = async () => {
    const res = await axios.get(`${API_URL}/pending`)
    setPending(res.data.computers)
  }

  const handleAction = async (id, action) => {
    await axios.post(`${API_URL}/decision`, {
      computer_id: id,
      decision: action
    })
    fetchPending()
  }

  useEffect(() => {
    fetchPending()
  }, [])

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">License Requests</h1>
      <ul className="space-y-4">
        {pending.map((item, idx) => (
          <li key={idx} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <span>{item}</span>
            <div className="space-x-2">
              <button
                onClick={() => handleAction(item, 'approve')}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(item, 'reject')}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

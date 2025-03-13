// import Avatar from 'components/Avatar'
// import logo from 'assets/logo.svg'
import { useState, useEffect } from 'react'
import SearchBox from 'components/Header'

const App = () => {
  // LOCAL STATES
  const [objToInspect, setObjToInspect] = useState('')
  const [logsAS400, setLogsAS400] = useState([])

  useEffect(() => {
    let objQuery = objToInspect
    if (objQuery === '') return

    fetch(`/api/descObject/${objQuery}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        console.log(data)
        setLogsAS400(data.result)
      })
  }, [objToInspect])

  return (
    <>
      <div>
        <SearchBox
          objToInspect={objToInspect}
          setObjToInspect={setObjToInspect}
        />
      </div>
      {objToInspect !== '' && (
        <code className="relative mx-auto h-[92dvh] max-w-4xl flex flex-col gap-3 overflow-y-auto break-all bg-base-200 p-12 pt-10 text-xs shadow-md text-gray-700 bg-gray-100">
          {logsAS400 &&
            logsAS400.map((log, index) => {
              return <p key={index}>{log['SRCDTA']}</p>
            })}
        </code>
      )}
    </>
  )
}

export default App

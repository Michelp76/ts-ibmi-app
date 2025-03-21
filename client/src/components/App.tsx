import { useState, useEffect } from 'react'
import SearchBox from 'components/Header'
import { PrismAsyncLight as Prism } from 'react-syntax-highlighter'
import virtualizedRenderer from 'react-syntax-highlighter-virtualized-renderer'
import nordStyle from 'react-syntax-highlighter/dist/esm/styles/prism/nord'

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

        resetScroll()
      })
  }, [objToInspect])

  const resetScroll = () => {
    // Reset scroll
    const divWithScroll = document.getElementById('scroller')
    if (divWithScroll) divWithScroll.scroll(0, 0)
  }

  const getStringFromFetch = (): string => {
    let concatStr: string = ''
    if (logsAS400.length > 0) {
      logsAS400.map((log, index) => {
        concatStr += `${log['SRCDTA']}\n`
      })
    }
    return concatStr
  }

  return (
    <>
      <div>
        <SearchBox
          objToInspect={objToInspect}
          setObjToInspect={setObjToInspect}
        />
      </div>
      {objToInspect !== '' && logsAS400.length > 0 && (
        <div id="scroller" className="wrapperDiv relative mx-auto max-w-4xl flex flex-col h-dvh overflow-y-auto pt-[70px] shadow-lg text-xs text-gray-700">
          <Prism
            style={nordStyle}
            language="aql"
            renderer={virtualizedRenderer()}
          >
            {getStringFromFetch()}
          </Prism>
        </div>
      )}
    </>
  )
}

export default App

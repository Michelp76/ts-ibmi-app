import { useState, useEffect } from 'react'
import SearchBox from 'components/Header'
import { PrismAsyncLight as Prism } from 'react-syntax-highlighter'
import virtualizedRenderer from 'react-syntax-highlighter-virtualized-renderer'
import nordStyle from 'react-syntax-highlighter/dist/esm/styles/prism/nord'

const App = () => {
  // LOCAL STATES
  const [objToInspect, setObjToInspect] = useState('')
  const [progError, setProgError] = useState('')
  const [lineError, setLineError] = useState('')
  const [operationType, setOperationType] = useState('descObject')
  const [logsAS400, setLogsAS400] = useState([])

  useEffect(() => {
    let operationType: string = 'descObject'

    const objQuery: string = objToInspect
    if (objQuery === '') return

    const jobParts = objQuery.split('/')
    if (jobParts !== null && jobParts.length == 3) {
      operationType = 'searchJobLog'
    }

    fetch(`/api/${operationType}/${objQuery}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        console.log(data.result)

        if (operationType !== 'searchJobLog') setLogsAS400(data.result)
        else {
          // Mode: searchJobLog
          // -- Affiche dump + highlight ligne en erreur

          // Set States
          setLogsAS400(data.result[0]) // Source dans le tableau indice à 0
          setProgError(data.result[1]['SRCPROG'])
          setLineError(data.result[2]['SRCLINE'])
        }

        // States
        setOperationType(operationType)

        // Restore scroll
        resetScroll()
      })
  }, [objToInspect])

  const getStringFromFetch = (
    opType: string,
    progError: string,
    lineError: string
  ): string => {
    // console.log(progError)
    // console.log(lineError)
    let concatStr: string = ''
    if (logsAS400.length > 0) {
      logsAS400.map((log, index) => {
        concatStr += `${log['data']}\n`
      })

      // Nom du programme cliquable en lien
      if (opType === 'searchJobLog') {
        // concatStr = concatStr.replaceAll(progError, `<a href="URL">${progError}</a>`)
      }
    }
    return concatStr
  }

  const resetScroll = () => {
    // Reset scroll
    const divWithScroll = document.getElementById('scroller')
    if (divWithScroll) divWithScroll.scroll(0, 0)
  }

  return (
    <>
      <SearchBox
        objToInspect={objToInspect}
        setObjToInspect={setObjToInspect}
      />
      {objToInspect !== '' && logsAS400 && logsAS400.length > 0 && (
        <div
          id="scroller"
          className="wrapperDiv relative mx-auto max-w-5xl flex flex-col h-dvh
                     overflow-y-auto pt-[70px] shadow-md text-xs text-gray-700
                     border-2 border-solid border-[#f2f2f2]"
        >
          <Prism
            style={nordStyle}
            language={operationType === 'searchJobLog' ? 'text' : 'aql'}
            renderer={virtualizedRenderer()}
          >
            {getStringFromFetch(operationType, progError, lineError)}
          </Prism>
        </div>
      )}
    </>
  )
}

export default App

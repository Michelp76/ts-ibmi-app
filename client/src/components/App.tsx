import { useState, useEffect, CSSProperties } from 'react'
import SearchBox from 'components/Header'
import { PrismAsyncLight as Prism } from 'react-syntax-highlighter'
import virtualizedRenderer from 'react-syntax-highlighter-virtualized-renderer'
import nordStyle from 'react-syntax-highlighter/dist/esm/styles/prism/nord'
import BeatLoader from 'react-spinners/BeatLoader'

const override: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  position: 'absolute',
  top: '28px',
  right: '480px',
  zIndex: '99'
}

const App = () => {
  // LOCAL STATES
  const [objToInspect, setObjToInspect] = useState('')
  const [progError, setProgError] = useState('')
  const [lineError, setLineError] = useState('')
  const [operationType, setOperationType] = useState('descObject')
  const [logsAS400, setLogsAS400] = useState([])
  let [loading, setLoading] = useState(false)

  useEffect(() => {
    let operationType: string = 'descObject'

    const objQuery: string = objToInspect
    if (objQuery === '') return

    setLoading(true)

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
        // Debug
        console.log(data.result)

        if (operationType !== 'searchJobLog') {
          setLogsAS400(data.result)
        } else {
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
      .finally(() => {
        // Loader
        setLoading(false)
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

      // const leftPane = document.getElementById('leftPane')
      // if (leftPane !== null) {
      //   if (opType === 'searchJobLog') {
      //     leftPane.removeClass()
      //   } else {
      //   }
      // }
    }
    return concatStr
  }

  const resetScroll = () => {
    // Reset scroll
    const divWithScroll = document.getElementById('scroller')
    if (divWithScroll) divWithScroll.scroll(0, 0)
  }

  // window.addEventListener('keydown', function (e) {
  //   if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
  //     if (document.getElementById('search') !== document.activeElement) {
  //       e.preventDefault();
  //       console.log('Search is not in focus');
  //       document.getElementById('search')?.focus();
  //     } else {
  //       console.log('Default action of CtrlF');
  //       return true;
  //     }
  //   }
  // });

  return (
    <>
      <SearchBox
        objToInspect={objToInspect}
        setObjToInspect={setObjToInspect}
      />
      <BeatLoader
        color={'#000000'}
        loading={loading}
        size={10}
        cssOverride={override}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      {objToInspect !== '' && logsAS400 && logsAS400.length > 0 && (
        <>
          {/* Grille à 2/3 colonnes :
          https://stackoverflow.com/questions/72380072/specifying-grid-column-row-size-in-tailwindcss */}
          <div className="grid grid-cols-[3fr,8fr,3fr] gap-x-8 h-[87svh] !mt-[100px] mx-auto px-6">
            {/* Panneau Infos */}
            <div
              id="leftPane"
              className="relative
                         shadow-md text-xs bg-[#2E3440] text-gray-700
                         rounded-sm invisible"
            ></div>
            {/* pavé code / dump */}
            <div
              id="scroller"
              className="wrapperDiv relative
              shadow-md text-xs overflow-y-auto text-gray-700"
            >
              <Prism
                style={nordStyle}
                language={operationType === 'searchJobLog' ? 'text' : 'aql'}
                renderer={virtualizedRenderer()}
              >
                {getStringFromFetch(operationType, progError, lineError)}
              </Prism>
            </div>
            {/* Masquée pour l'instant */}
            <div
              id="rightPane"
              className="relative
                         shadow-md text-xs bg-[#2E3440] text-gray-700 rounded-sm invisible"
            ></div>
          </div>
        </>
      )}
    </>
  )
}

export default App

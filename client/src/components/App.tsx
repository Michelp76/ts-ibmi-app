import { useState, useEffect, CSSProperties, useRef } from 'react'
import SearchBox from 'components/Header'
// @ts-ignore
import { PrismLight as Prism } from 'react-syntax-highlighter'
import virtualizedRenderer from './react-syntax-highlighter-virtualized-renderer-esm'
// @ts-ignore
import nordStyle from 'react-syntax-highlighter/dist/esm/styles/prism/nord'
import BeatLoader from 'react-spinners/BeatLoader'
// @ts-ignore
import SearchApi from 'js-worker-search'
// @ts-ignore
import Mark from 'mark.js'

const override: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  position: 'absolute',
  top: '28px',
  right: '480px',
  zIndex: '99'
}

const useComponentDidUpdate = (callback: any, condition: any) => {
  const isMounted = useRef(false)
  useEffect(() => {
    if (isMounted.current) {
      callback()
    } else {
      isMounted.current = true
    }
  }, condition)
}

const App = () => {
  // LOCAL STATES
  const [objToInspect, setObjToInspect] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCount, setSearchCount] = useState(-1)
  const [searchLine, setSearchLine] = useState(0)
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [progError, setProgError] = useState('')
  const [lineError, setLineError] = useState('')
  const [operationType, setOperationType] = useState('descObject')
  const [logsAS400, setLogsAS400] = useState([])
  let [loading, setLoading] = useState(false)

  // 'js-worker-search' instance
  const searchApi = new SearchApi()

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
          // RAZ states
          setSearchTerm('')
          setSearchCount(-1)
          setSearchLine(0)
          setSearchResults([])
          setProgError('')
          setLineError('')

          setLogsAS400(data.result)
        } else {
          // Mode: searchJobLog
          // -- Affiche dump + highlight ligne en erreur

          // Set States
          setLogsAS400(data.result[0]) // Source dans le tableau indice à 0
          if (data.result[1] !== undefined)
            setProgError(data.result[1]['SRCPROG'])
          if (data.result[2] !== undefined)
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

  // Highlight le mot recherché
  useComponentDidUpdate(() => {
    if (searchLine !== 0) {
      console.log(
        `highlighting search word ${searchTerm} at line ${searchLine}.`
      )

      // mark.js
      var context = document.querySelector('.codeDsp')
      var instance = new Mark(context)
      setTimeout(() => {
        instance.mark(searchTerm)
      }, 100)
    }
  }, [searchLine])

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
        let codeLine: string = log['data'] as string

        if (searchTerm != '') {
          // Indexing
          // Index as many objects as you want.
          // Objects are identified by an id (the first parameter).
          // Each Object can be indexed multiple times (once per string of related text).
          searchApi.indexDocument(index, codeLine)
        }
        // Concat pour affichage du source
        concatStr += `${codeLine}\n`
      })
    }
    return concatStr
  }

  const handleChange = (event: any) => {
    setSearchTerm(event.target.value)
  }

  const searchJsWorker = async (searchTerm: string) => {
    return searchApi.search(searchTerm)
  }

  const handleSearch = async (event: any) => {
    event.preventDefault()
    //
    console.log(`Searching for ${searchTerm}...`)

    let searchLocal: number[] = []
    if (searchResults.length === 0) {
      // Search for matching documents using the `search` method.
      // In this case the promise will be resolved with the Array ['foo', 'bar'].
      // This is because the word "describing" appears in both indices.
      // const promise = searchApi.search(searchTerm).then(function (foundRes: number[]) {
      //   searchLocal = foundRes;
      // })
      searchLocal = await searchJsWorker(searchTerm)
    } else {
      searchLocal = searchResults
    }
    //
    console.log(
      `search in document - object: ${objToInspect.trim()} - type opération: ${operationType} --> ${searchLocal}`
    )

    let lineIndex: number
    // Increment
    let searchIdxLocal = searchCount + 1

    lineIndex = searchLocal[searchIdxLocal]
    // Fin de recherche --> reset
    if (searchIdxLocal >= searchLocal.length) {
      searchIdxLocal = -1
      lineIndex = 0
    }
    // Save dans state
    setSearchResults(searchLocal) // tableau de résultat(s) de recherche
    setSearchCount(searchIdxLocal) // Index actuel dans le tableau de résultat(s) de recherche
    setSearchLine(lineIndex) // N° de ligne où se trouve le/un des résultat(s) de recherche
  }

  const resetScroll = () => {
    // Reset scroll
    const divWithScroll = document.getElementById('scroller')
    if (divWithScroll) divWithScroll.scroll(0, 0)
  }

  // Capture la combinaison de touches Ctrl + F
  // pour forcer le focus sur le champ Recherche 'maison'
  window.addEventListener('keydown', function (e) {
    if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
      if (
        document.getElementById('default-search') !== document.activeElement
      ) {
        e.preventDefault()
        console.log('Search is not in focus')
        document.getElementById('default-search')?.focus()
      } else {
        console.log('Default action of CtrlF')
        return true
      }
    }
  })

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
                         py-6
                         shadow-md text-xs bg-[#2E3440] text-gray-700
                         rounded-sm"
            >
              <form className="max-w-xs mx-auto" onSubmit={handleSearch}>
                <label className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                      />
                    </svg>
                  </div>
                  <input
                    type="search"
                    id="default-search"
                    value={searchTerm}
                    onChange={handleChange}
                    className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Recherche..."
                    required
                  />
                  <button
                    id="searchBtn"
                    type="submit"
                    className="text-white absolute end-2.5 bottom-2.5 bg-[#5e81ac] hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-md text-sm px-4 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
            {/* pavé code / dump */}
            <div
              id="scroller"
              className="wrapperDiv relative
              shadow-md text-xs overflow-y-auto text-gray-700"
            >
              <Prism
                style={nordStyle}
                language={operationType === 'searchJobLog' ? 'text' : 'aql'}
                className="codeDsp"
                // showLineNumbers={true}
                renderer={virtualizedRenderer({
                  overscanRowCount: 10, // default
                  scrollToIndex: searchLine
                })}
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

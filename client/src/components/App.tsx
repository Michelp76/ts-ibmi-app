import { useState, useEffect, CSSProperties, useRef } from 'react'
import SearchBox from 'components/Header'
import { PrismLight as Prism } from 'react-syntax-highlighter'
import virtualizedRenderer from './react-syntax-highlighter-virtualized-renderer-esm'
import nordStyle from 'react-syntax-highlighter/dist/esm/styles/prism/nord'
import BeatLoader from 'react-spinners/BeatLoader'
import SearchApi from 'js-worker-search'
import Mark from 'mark.js'
import { FiClipboard } from 'react-icons/fi'
import { OperationType, searchType } from 'utils'

// "BeatLoader": loading progress
const override: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  position: 'absolute',
  top: '26px',
  right: '856px',
  zIndex: '99'
}

const App = () => {
  // LOCAL STATES
  const [objToInspect, setObjToInspect] = useState('')
  const [stringToSearch, setStringToSearch] = useState('')
  const [targetEnv, setTargetEnv] = useState('NETPAISRC')
  const [modeRecherche, setModeRecherche] = useState('auto-complete')
  const [showLineNumber, setShowLineNumber] = useState('hide-line-number')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTermMemo, setSearchTermMemo] = useState('')
  const [searchCount, setSearchCount] = useState(-1)
  const [searchLine, setSearchLine] = useState(0)
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [progError, setProgError] = useState('')
  const [lineError, setLineError] = useState('')
  const [operationType, setOperationType] = useState('descObject')
  const [logsAS400, setLogsAS400] = useState([])
  const [srcSearchResults, setSrcSearchResults] = useState([])
  let [loading, setLoading] = useState(false)
  let [searchFinished, setSearchFinished] = useState(false)

  // 'js-worker-search' instance
  const searchApi = new SearchApi()

  useEffect(() => {
    if (objToInspect === '') return

    // react-spinners
    setLoading(true)

    if (stringToSearch === '') {
      setSearchFinished(false)
    }

    fetch(`/api/${operationType}/${objToInspect}/${targetEnv}`, {
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

        if (operationType === OperationType.DESCOBJET) {
          // RAZ states
          if (stringToSearch === '') {
            // Réinit terme de recherche,
            // sauf si issu de la recherche "globale" Progs cf. setStringToSearch()
            setSearchTerm('')
          }
          setSearchTermMemo('')
          setSearchCount(-1)
          setSearchLine(0)
          setSearchResults([])
          setProgError('')
          setLineError('')

          // Force purge de l'état : utile ou placebo ?
          setLogsAS400([])

          // Affiche le code dans l'éditeur Prism
          setLogsAS400(data.result)
        } else if (operationType === OperationType.SEARCHPROGS) {
          setSrcSearchResults(data.result)
        } else if (operationType === OperationType.SEARCHJOBLOG) {
          // Mode: searchJobLog
          // -- Affiche dump + highlight ligne en erreur

          // Set States
          setLogsAS400(data.result[0]) // Source dans le tableau indice à 0
          if (data.result[1] !== undefined)
            setProgError(data.result[1]['SRCPROG'])
          if (data.result[2] !== undefined)
            setLineError(data.result[2]['SRCLINE'])
        }

        // Restore scroll
        resetScroll()
      })
      .finally(() => {
        // Loader
        setLoading(false)
        setSearchFinished(true)
      })
  }, [objToInspect])

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

  // Highlight le mot recherché
  useComponentDidUpdate(() => {
    if (searchLine !== 0) {
      console.log(
        `highlighting search word ${searchTerm} at line ${searchLine}.`
      )

      // mark.js
      let context = document.querySelector('.codeDsp')
      let instance = new Mark(context)
      setTimeout(() => {
        instance.mark(searchTerm)
      }, 100)
    }
  }, [searchLine])

  useComponentDidUpdate(() => {
    if (modeRecherche === searchType.SEARCHSOURCE) {
      // Soumet une recherche auto, si issu de la recherche "globale" Progs cf. setStringToSearch()
      if (stringToSearch !== '') {
        handleSearch(null)
      }
    }
  }, [logsAS400])

  const getStringFromFetch = (
    opType: string,
    progError: string,
    lineError: string
  ): string => {
    // console.log(progError)
    // console.log(lineError)

    // mark.js -- retire toutes les "surbrillances"
    let context = document.querySelector('.codeDsp')
    let instance = new Mark(context)
    instance.unmark()

    let concatStr: string = ''
    if (logsAS400.length > 0) {
      logsAS400.map((log, index) => {
        let numLine: string = log['numLine'] as string
        let codeLine: string = log['data'] as string

        if (searchTerm != '') {
          // Indexing
          // Index as many objects as you want.
          // Objects are identified by an id (the first parameter).
          // Each Object can be indexed multiple times (once per string of related text).
          searchApi.indexDocument(index, numLine + codeLine)
        }
        // Concat pour affichage du source
        concatStr += `${
          showLineNumber === 'show-line-number' ? numLine : ''
        }   ${codeLine}\n`
      })
    }
    return concatStr
  }

  const srcSearchList = () => {
    const searchResLine = Object.entries(srcSearchResults).map(
      ([key, value]) => (
        <div
          className="searchRes rounded-md bg-[#5e81ac]/20 hover:bg-[#5e81ac]/90 active:bg-[#c47457] cursor-pointer p-2 mb-1 mx-2 pl-4 max-w-xs"
          key={value['SRCFILE']}
          onClick={(e) => {
            // console.log(value['SRCFILE'])
            setOperationType(OperationType.DESCOBJET)
            setObjToInspect(value['SRCFILE'])

            // Reset clicked color
            let elList: NodeListOf<HTMLElement> =
              document.querySelectorAll('.searchRes')
            const targetSrc = e.currentTarget.innerText
            elList.forEach((el) => {
              el.style.backgroundColor = ''
              el.style.color = ''
            })
            // le source choisi/cliqué pour affichage reste en surbrillance
            e.currentTarget.style.backgroundColor = '#d08770'
            e.currentTarget.style.color = '#222'
          }}
        >
          {value['SRCFILE'] as string}
        </div>
      )
    )
    return (
      <>
        {modeRecherche === searchType.SEARCHSOURCE && stringToSearch !== '' && (
          <div className="text-white text-sm italic w-md p-2 mb-[6px] !mt-[10px]">
            {srcSearchResults.length > 0 ? (
              <strong>
                Résultats recherche "{stringToSearch}" dans "{targetEnv}"
              </strong>
            ) : (
              <strong>
                Aucun résultat pour "{stringToSearch}" dans "{targetEnv}"
              </strong>
            )}
          </div>
        )}
        <div
          id="searchResults"
          className="h-[73svh] overflow-y-auto block w-sm max-w-sm text-sm text-gray-900 rounded-md bg-[#2E3440] text-white py-2"
        >
          {searchResLine}
        </div>
      </>
    )
  }

  const handleChange = (event: any) => {
    setSearchTerm(event.target.value)
  }

  const jsWorkerSearch = async (searchTerm: string) => {
    return searchApi.search(searchTerm)
  }

  const handleSearch = async (event: any) => {
    if (event != undefined) event.preventDefault()

    // react-spinners
    setLoading(true)

    let searchLocal: number[] = []
    if (searchTerm !== searchTermMemo) {
      // Mémo recherche
      setSearchTermMemo(searchTerm)

      // Search for matching documents using the `search` method.
      // In this case the promise will be resolved with the Array ['foo', 'bar'].
      // This is because the word "describing" appears in both indices.
      // const promise = searchApi.search(searchTerm).then(function (foundRes: number[]) {
      //   searchLocal = foundRes;
      // })
      searchLocal = await jsWorkerSearch(searchTerm)
      // "If search is running in a web worker, this will terminate the worker to allow for garbage collection"
      searchApi.terminate()
    } else {
      // Même terme de recherche: on va récupérer le tableau de résultats de recherche
      // et afficher l'itération suivante
      searchLocal = searchResults
    }
    //
    console.log(
      `Searching for ${searchTerm} in document - object: ${objToInspect.trim()} - type opération: ${operationType} --> ${searchLocal}`
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

    // react-spinners
    setLoading(false)
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

  const handleCopy = () => {
    navigator.clipboard.writeText(
      getStringFromFetch(operationType, progError, lineError)
    )
    // console.log('handleCopy')
  }

  return (
    <>
      <SearchBox
        operationType={operationType}
        setOperationType={setOperationType}
        objToInspect={objToInspect}
        setObjToInspect={setObjToInspect}
        stringToSearch={stringToSearch}
        setStringToSearch={setStringToSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        targetEnv={targetEnv}
        setTargetEnv={setTargetEnv}
        modeRecherche={modeRecherche}
        setModeRecherche={setModeRecherche}
        showLineNumber={showLineNumber}
        setShowLineNumber={setShowLineNumber}
        searchFinished={searchFinished}
        setSearchFinished={setSearchFinished}
      />
      <BeatLoader
        color={'#000000'}
        loading={loading}
        size={10}
        cssOverride={override}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      {objToInspect !== '' && searchFinished && (
        <>
          {/* Grille à 2/3 colonnes :
          https://stackoverflow.com/questions/72380072/specifying-grid-column-row-size-in-tailwindcss */}
          <div className="grid grid-cols-[3fr,8fr,3fr] gap-x-4 h-[90svh] !mt-[80px] mx-auto px-5">
            {/* Panneau gauche Infos */}
            <div
              id="leftPane"
              className="relative
                         pt-6
                         px-4
                         shadow-md text-xs bg-[#2E3440] text-gray-700
                         rounded-sm"
            >
              {/* Champ texte recherche */}
              <form className="max-w-sm mx-auto p-2" onSubmit={handleSearch}>
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
                    className="block w-80 p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Recherche (document actif)..."
                    required
                  />
                  <button
                    id="searchBtn"
                    type="submit"
                    className="text-white absolute end-2.5 bottom-2.5 bg-[#5e81ac] hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-md text-sm px-4 mr-6 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Search
                  </button>
                </div>
              </form>
              {/* Résultats de recherche (cf. fonction 'searchProgs') */}
              {srcSearchList()}
            </div>
            {/* pavé code / dump */}
            {logsAS400 && logsAS400.length > 0 && (
              <div
                id="scroller"
                className="wrapperDiv relative
              shadow-md text-xs overflow-y-auto text-gray-700"
              >
                <Prism
                  style={nordStyle}
                  language={
                    operationType === OperationType.SEARCHJOBLOG
                      ? 'text'
                      : 'apex'
                  }
                  className="codeDsp"
                  // showLineNumbers={true}
                  renderer={virtualizedRenderer({
                    overscanRowCount: 10, // default
                    scrollToIndex: searchLine
                  })}
                >
                  {getStringFromFetch(operationType, progError, lineError)}
                </Prism>
                <FiClipboard
                  className="copy-icon"
                  title="Copier"
                  onClick={handleCopy}
                />
              </div>
            )}
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

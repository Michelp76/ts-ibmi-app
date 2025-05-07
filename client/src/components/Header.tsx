import { useEffect, useState } from 'react'
import ReactSearchBox from 'react-search-box'
import { SplitButtonDropdown } from 'components/Dropdown'
import { OperationType, searchType } from 'utils'

const SearchBox = ({
  operationType,
  setOperationType,
  objToInspect,
  setObjToInspect,
  stringToSearch,
  setStringToSearch,
  searchTerm,
  setSearchTerm,
  targetEnv,
  setTargetEnv,
  modeRecherche,
  setModeRecherche,
  showLineNumber,
  setShowLineNumber,
  searchFinished,
  setSearchFinished
}: {
  operationType: string
  setOperationType: (arg: string) => void
  objToInspect: string
  setObjToInspect: (arg: string) => void
  stringToSearch: string
  setStringToSearch: (arg: string) => void
  searchTerm: string
  setSearchTerm: (arg: string) => void
  targetEnv: string
  setTargetEnv: (arg: string) => void
  modeRecherche: string
  setModeRecherche: (arg: string) => void
  showLineNumber: string
  setShowLineNumber: (arg: string) => void
  searchFinished: boolean
  setSearchFinished: (arg: boolean) => void
}) => {
  const [environments, setEnvironments] = useState([])
  const [objectsAS400, setObjectsAS400] = useState([])
  let isItemSelected: boolean = false

  const listEnvironments = (): any => {
    fetch('/api/listLibraries/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        // Transformation éventuelle des données, pour coller au format attendu ["KEY", "VALUE" => "key", "value"]
        // const tempData = data.result.map((srcEnv: any) => {
        //   return { title: srcEnv.TABLE_SCHEMA }
        // })
        if (data && data.result.length > 0) {
          console.log(data.result)
          setEnvironments(data.result)
        }
      })
  }

  const listObjectsAS400 = (destEnv: string): any => {
    if (modeRecherche === searchType.AUTOCOMPLETE) {
      fetch(`/api/listObjectsAS400/${destEnv}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((res) => {
          return res.json()
        })
        .then((data) => {
          if (data && data.combinedArray.length > 0) {
            console.log(data.combinedArray)
            setObjectsAS400(data.combinedArray)
          }
        })
    }
  }

  useEffect(() => {
    // Liste de bibliothèques
    listEnvironments()
    // Autocomplete pour liste de progs/tables
    listObjectsAS400('NETPAISRC')
    //console.log('test', objectsAS400)
  }, [])

  // Changement d'environnement (targetEnv) depuis la liste déroulante dédiée
  useEffect(() => {
    // Autocomplete pour liste de progs/tables
    listObjectsAS400(targetEnv)
    // console.log(targetEnv)

    // RAZ 'objet à inspecter', pour forcer le hook useEffect([objToInspect] dans App.tsx)
    setObjToInspect('')
  }, [targetEnv])

  useEffect(() => {
    // Pas besoin d'autocomplete en mode recherche dans les sources
    if (modeRecherche === searchType.SEARCHSOURCE) {
      setObjectsAS400([])
    } else {
      listObjectsAS400(targetEnv)
    }
  }, [modeRecherche])

  return (
    // Décalage vers le bas des éléments en dessous :
    // https://github.com/ghoshnirmalya/react-search-box/issues/183
    //
    // Trigger search with Enter key :
    // https://github.com/ghoshnirmalya/react-search-box/issues/106
    //
    <nav className="fixed top-0 left-0 w-full bg-[#2E3440] py-3 z-50 h-[4rem] drop-shadow-md">
      {/* 930px en dur, c'est moche.. */}
      <div className="relative container mx-auto w-[66rem] grid grid-cols-[41.2rem,10.4rem,11.9rem,11.0rem] gap-x-4">
        <ReactSearchBox
          placeholder="Rechercher..."
          data={objectsAS400}
          onSelect={(record: any) => {
            console.log(record)
            setOperationType(OperationType.DESCOBJET)
            setObjToInspect(record.item.value)
            // Flag à 'Oui'
            isItemSelected = true
          }}
          onFocus={() => {
            // console.log('This function is called when is focussed')
          }}
          onChange={(value) => {
            console.log(value)

            if (!isItemSelected) {
              // Hack Pour éviter de passer, à la fois dans 'onSelect' ET dans 'onChange'
              if (value.length >= 4 && value.length < 22) {
                if (modeRecherche === searchType.SEARCHSOURCE) {
                  // Recherche dans les sources (rpgle, clpsrc... tables aussi ?)
                  setOperationType(OperationType.SEARCHPROGS)
                  setObjToInspect(value)
                  setStringToSearch(value) // Affiche la chaine de recherche en cours au dessus des résultats (de recherche)
                  setSearchTerm(value)

                  setSearchFinished(false)
                }
              } else if (value.length >= 22) {
                // ie --> 597142/DEVPAIE/TRTMENS
                // Detect job Log format & lance une recherche le cas échéant
                const jobParts = value.split('/')
                if (jobParts !== null && jobParts.length == 3) {
                  setOperationType(OperationType.SEARCHJOBLOG)
                  setObjToInspect(value)
                }
              }
            }
          }}
          inputFontSize="14px"
          autoFocus
        />
        {/* Combo environnements */}
        <SplitButtonDropdown
          buttonLabel={targetEnv}
          items={environments}
          currentState={targetEnv}
          setCurrentState={setTargetEnv}
        />
        {/* Recherche par nom de programme ou recherche dans le source de(s) programmes */}
        <SplitButtonDropdown
          buttonLabel={modeRecherche}
          items={[
            {
              title: 'auto-complete'
            },
            {
              title: 'search-in-source'
            }
          ]}
          currentState={modeRecherche}
          setCurrentState={setModeRecherche}
        />
        {/* Recherche par nom de programme ou recherche dans le source de(s) programmes */}
        <SplitButtonDropdown
          buttonLabel={showLineNumber}
          items={[
            {
              title: 'show-line-number'
            },
            {
              title: 'hide-line-number'
            }
          ]}
          currentState={showLineNumber}
          setCurrentState={setShowLineNumber}
        />
      </div>
    </nav>
  )
}

export default SearchBox

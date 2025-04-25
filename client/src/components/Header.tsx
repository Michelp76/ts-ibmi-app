import { useEffect, useState } from 'react'
import ReactSearchBox from 'react-search-box'
import { SplitButtonDropdown } from 'components/Dropdown'

const SearchBox = ({
  objToInspect,
  setObjToInspect,
  targetEnv,
  setTargetEnv
}: {
  objToInspect: string
    setObjToInspect: (arg: string) => void
    targetEnv: string
    setTargetEnv: (arg: string) => void
}) => {
  const [environments, setEnvironments] = useState([])
  const [objectsAS400, setObjectsAS400] = useState([])

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

  useEffect(() => {
    // Liste de bibliothèques
    listEnvironments()
    // Autocomplete pour liste de progs/tables
    listObjectsAS400('NETPAISRC')
    //console.log('test', objectsAS400)
  }, [])

  // Changement d'environnement depuis la liste déroulante dédiée
  useEffect(() => {
    // Autocomplete pour liste de progs/tables
    listObjectsAS400(targetEnv)
    // console.log(targetEnv)
  }, [targetEnv])

  return (
    // Décalage vers le bas des éléments en dessous :
    // https://github.com/ghoshnirmalya/react-search-box/issues/183
    //
    // Trigger search with Enter key :
    // https://github.com/ghoshnirmalya/react-search-box/issues/106
    //
    <nav className="fixed top-0 left-0 w-full bg-[#2E3440] py-3 z-50 h-[4rem] drop-shadow-md">
      {/* 930px en dur, c'est moche.. */}
      <div className="relative container mx-auto w-[66rem] grid grid-cols-[1fr,9.3rem] gap-x-4">
        <ReactSearchBox
          placeholder="Rechercher..."
          data={objectsAS400}
          onSelect={(record: any) => {
            console.log(record)
            setObjToInspect(record.item.value)
          }}
          onFocus={() => {
            // console.log('This function is called when is focussed')
          }}
          onChange={(value) => {
            if (value.length >= 22) {  // 597142/DEVPAIE/TRTMENS
              console.log(value)

              // Detect job Log format & lance une recherche le cas échéant
              const jobParts = value.split('/')
              if (jobParts !== null && jobParts.length == 3)
                setObjToInspect(value)
            }
          }}
          inputFontSize="14px"
          autoFocus
        />
        <SplitButtonDropdown
          buttonLabel="Bibliothèque"
          items={environments}
          targetEnv={targetEnv}
          setTargetEnv={setTargetEnv}
        />
      </div>
    </nav>
  )
}

export default SearchBox

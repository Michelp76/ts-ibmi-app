import { useEffect, useState } from 'react'
import ReactSearchBox from 'react-search-box'

const SearchBox = ({
  objToInspect,
  setObjToInspect
}: {
  objToInspect: string
  setObjToInspect: (arg: any) => void
}) => {
  const [objectsAS400, setObjectsAS400] = useState([])
  const listObjectsAS400 = (): any => {
    fetch('/api/listObjectsAS400/', {
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
        // const tempData = data.result.map((line: any) => {
        //   return { key: line.KEY, value: line.VALUE }
        // })
        console.log(data.combinedArray)
        setObjectsAS400(data.combinedArray)
      })
  }

  useEffect(() => {
    listObjectsAS400()
    console.log('test', objectsAS400)
  }, [])

  return (
    // Décalage vers le bas des éléments en dessous :
    // https://github.com/ghoshnirmalya/react-search-box/issues/183
    //
    // Trigger search with Enter key :
    // https://github.com/ghoshnirmalya/react-search-box/issues/106
    //
    <nav className="relative top-0 left-0 w-full bg-[#4c566a]/90 py-4 shadow-md z-50">
      {/* 930px en dur, c'est moche.. */}
      <div className="relative container mx-auto px-4 w-[930px]">
        {/* <h1 className="text-xl font-bold">My Website</h1> */}
        <ReactSearchBox
          placeholder="Rechercher..."
          data={objectsAS400}
          onSelect={(record: any) => {
            console.log(record)
            setObjToInspect(record.item.key)
          }}
          onFocus={() => {
            // console.log('This function is called when is focussed')
          }}
          onChange={(value) => {
            console.log(value)
          }}
          inputFontSize="14px"
          autoFocus
        />
      </div>
    </nav>
  )
}

export default SearchBox

import { useEffect, useState } from 'react'
import ReactSearchBox from 'react-search-box'

const SearchBox = ({
  objToInspect,
  setObjToInspect
}: {
  objToInspect: string
  setObjToInspect: (arg: any) => void
}) => {
  const [tablesAS400, setTablesAS400] = useState([])
  const listTables = (): any => {
    fetch('/api/listTables/', {
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
        setTablesAS400(data.result)
      })
  }

  useEffect(() => {
    listTables()
    console.log('test', tablesAS400)
  }, [])

  return (
    // Décalage vers le bas des éléments en dessous :
    // https://github.com/ghoshnirmalya/react-search-box/issues/183
    //
    // Trigger search with Enter key :
    // https://github.com/ghoshnirmalya/react-search-box/issues/106
    //
    <nav className="relative top-0 left-0 w-full bg-[#4c566a]/90 py-4 shadow-xl z-50">
      {/* 930px en dur, c'est moche.. */}
      <div className="relative container mx-auto px-4 w-[930px]">
        {/* <h1 className="text-xl font-bold">My Website</h1> */}
        <ReactSearchBox
          placeholder="Rechercher..."
          data={tablesAS400}
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
          autoFocus
        />
      </div>
    </nav>
  )
}

export default SearchBox

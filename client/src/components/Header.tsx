import { useState } from 'react'
import ReactSearchBox from 'react-search-box'

const SearchBox = () => {
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
        //return data.result
      })
  }

  return (
    // Décalage vers le bas des éléments en dessous :
    // https://github.com/ghoshnirmalya/react-search-box/issues/183
    //
    // Trigger search with Enter key :
    // https://github.com/ghoshnirmalya/react-search-box/issues/106
    <nav className="fixed top-0 left-0 w-full bg-[#4c566a]/80 py-4 shadow-xl z-50">
      <div className="container mx-auto px-4">
        {/* <h1 className="text-xl font-bold">My Website</h1> */}
        <ReactSearchBox
          placeholder="Rechercher..."
          data={tablesAS400}
          // data={[
          //   {
          //     key: 'john',
          //     value: 'John Doe'
          //   },
          //   {
          //     key: 'jane',
          //     value: 'Jane Doe'
          //   },
          //   {
          //     key: 'mary',
          //     value: 'Mary Phillips'
          //   },
          //   {
          //     key: 'robert',
          //     value: 'Robert'
          //   },
          //   {
          //     key: 'karius',
          //     value: 'Karius'
          //   }
          // ]}
          onSelect={(record: any) => console.log(record)}
          onFocus={() => {
            console.log('This function is called when is focussed')
          }}
          onChange={(value) => listTables()}
          autoFocus
        />
      </div>
    </nav>
  )
}

export default SearchBox

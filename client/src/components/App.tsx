// import Avatar from 'components/Avatar'
// import logo from 'assets/logo.svg'
import { useState, useEffect } from 'react'
import SearchBox from 'components/Header'

const App = () => {
  const [logsAS400, setLogsAS400] = useState([])
  useEffect(() => {
    fetch('/api/descObject/contrat', {
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
      })
  }, [])

  return (
    <>
      <div>
        <SearchBox />
      </div>
      <code className="relative mx-auto max-w-4xl flex flex-col gap-3 overflow-y-auto break-all bg-base-200 p-12 pt-24 text-xs shadow-lg text-gray-700 bg-gray-100">
        {logsAS400 &&
          logsAS400.map((log, index) => {
            return (
              <p key={index}>
                {log['SRCDTA']}
              </p>
            )
          })}
      </code>
    </>
  )
}

// <div className="relative overflow-hidden bg-white">
//   <div className="h-screen sm:pb-40 sm:pt-24 lg:pb-48 lg:pt-40">
//     <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
//       <div className="sm:max-w-lg">
//         <div className="my-4">
//           <Avatar size="large" src={logo} />
//         </div>
//         <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
//           Welcome!
//         </h1>
//         <p className="mt-4 text-xl text-gray-500">
//           This is a boilerplate build with Vite, React 18, TypeScript,
//           Vitest, Testing Library, TailwindCSS 3, Eslint and Prettier.
//         </p>
//       </div>
//       <div className="my-10">
//         <a
//           href="vscode://"
//           className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-center font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
//         >
//           Start building for free
//         </a>
//         <div
//           aria-hidden="true"
//           className="pointer-events-none mt-10 md:mt-0 lg:absolute lg:inset-y-0 lg:mx-auto lg:w-full lg:max-w-7xl"
//         >
//           <div className="absolute sm:left-1/2 sm:top-0 sm:translate-x-8 lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-8">
//             <div className="flex items-center space-x-6 lg:space-x-8">
//               {randoms.map((random, number) => (
//                 <div
//                   key={`random-${random[number]}`}
//                   className="grid shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8"
//                 >
//                   {random.map((number) => (
//                     <div
//                       key={`random-${number}`}
//                       className="h-64 w-44 overflow-hidden rounded-lg sm:opacity-0 lg:opacity-100"
//                     >
//                       <img
//                         src={`https://picsum.photos/600?random=${number}`}
//                         alt=""
//                         className="size-full bg-indigo-100 object-cover object-center"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// </div>

export default App

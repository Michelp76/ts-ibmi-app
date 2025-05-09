// issu de https://github.com/Ibaslogic/dropdown-menu-react
import { useEffect, useRef, useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

interface SplitButtonDropdownProps {
  buttonLabel: string
  defaultAction?: () => void
  items: {
    title: string
    icon?: JSX.Element
    action?: () => void
  }[]
  currentState: string
  setCurrentState: (arg: string) => void
}

export const SplitButtonDropdown = ({
  buttonLabel,
  defaultAction,
  items,
  currentState,
  setCurrentState
}: SplitButtonDropdownProps) => {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonLabelRef = useRef<HTMLButtonElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) setFocusedIndex(null)
      return !prev
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setFocusedIndex(0) // Focus on the first item when arrow is pressed
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    } else if (event.key === 'Escape') {
      setOpen(false)
      setFocusedIndex(null) // Reset focus when dropdown closes
    }
  }

  const handleItemKeyDown = (
    event: React.KeyboardEvent<HTMLLIElement>,
    index: number
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setFocusedIndex((prevIndex) =>
        prevIndex! < items.length - 1 ? prevIndex! + 1 : 0
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusedIndex((prevIndex) =>
        prevIndex! > 0 ? prevIndex! - 1 : items.length - 1
      )
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const selectedItem = items[index]
      if (selectedItem.action) {
        selectedItem.action()
      }
      setOpen(false)
      setFocusedIndex(null)
      buttonRef.current?.focus()
    } else if (event.key === 'Escape') {
      setOpen(false)
      setFocusedIndex(null)
      buttonRef.current?.focus()
    }
  }

  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)

    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  useEffect(() => {
    if (open && focusedIndex !== -1) {
      const focusedItem = document.getElementById(
        `dropdown-item-${focusedIndex}`
      )
      focusedItem?.focus()
    }
  }, [focusedIndex, open])

  const handlePrimaryAction = () => {
    if (defaultAction) {
      defaultAction()
      setOpen(false)
    }
  }

  return (
    <div className="relative w-96" ref={menuRef}>
      <div className="inline-flex">
        {/* Primary Button */}
        <button
          id="button-label"
          type="button"
          ref={buttonLabelRef}
          className="inline-flex items-center justify-center rounded-l-md text-sm border border-[#e4e4e7] h-10 px-6 py-2 text-white"
          onClick={handlePrimaryAction}
          aria-label={`${buttonLabel} primary action`}
        >
          {buttonLabel}
        </button>
        {/* Dropdown Toggle Button */}
        <button
          id="dropdown-button"
          ref={buttonRef}
          type="button"
          className="inline-flex items-center justify-center rounded-r-md text-sm border border-l-0 border-[#e4e4e7] h-10 px-4 text-white"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls="dropdown-menu"
        >
          {open ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-12">
          <ul
            role="menu"
            id="dropdown-menu"
            aria-labelledby="dropdown-button"
            className="h-auto shadow-md rounded-md p-1 border bg-white overflow-y-auto max-h-screen"
          >
            {items.map((item, index) => (
              <li
                role="menuitem"
                key={index}
                id={`dropdown-item-${index}`}
                className={`relative flex items-center gap-2 px-6 py-1 text-sm hover:bg-gray-100 rounded-md ${
                  focusedIndex === index ? 'bg-gray-100' : ''
                }`}
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => {
                  const currentSel = item.title
                  if (buttonLabelRef.current !== null)
                    buttonLabelRef.current.innerText = currentSel

                  // Prop mise à jour en fonction de l'environnement
                  setCurrentState(currentSel)
                }}
                onKeyDown={(event) => handleItemKeyDown(event, index)}
              >
                {item.icon && <span>{item.icon}</span>}
                {
                  <button
                    className="w-full text-left"
                    onClick={() => {
                      item.action?.()
                      setOpen(false)
                    }}
                    type="button"
                  >
                    {item.title}
                  </button>
                }
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

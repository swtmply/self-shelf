import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Add01Icon,
  ArrowUpRight01Icon,
  Bookmark01Icon,
  Cancel01Icon,
  Delete02Icon,
  Edit02Icon,
  Folder01Icon,
  GridViewIcon,
  Image01Icon,
  Link01Icon,
  ListViewIcon,
  Menu01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { getMetadata } from "@/lib/metadata"

export const Route = createFileRoute("/")({
  validateSearch: (search) => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  component: App,
})

const defaultCategories = [
  "Articles",
  "Design",
  "Development",
  "Tools",
  "Inspiration",
]
const storageKey = "read-later.collection"

type Bookmark = {
  id: string
  url: string
  title: string
  description: string
  image: string
  category: string
}

type Collection = { bookmarks: Bookmark[]; categories: string[] }

function Icon({ icon, size = 20 }: { icon: typeof Add01Icon; size?: number }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  )
}

function App() {
  const { category: categoryParam } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [collection, setCollection] = useState<Collection>({
    bookmarks: [],
    categories: defaultCategories,
  })
  const [ready, setReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [editing, setEditing] = useState<Bookmark | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState<string | null>(null)
  const [categoryDraft, setCategoryDraft] = useState("")
  const [categoryError, setCategoryError] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(storageKey) ?? "null"
      ) as Partial<Collection> | null
      if (
        stored &&
        Array.isArray(stored.bookmarks) &&
        Array.isArray(stored.categories)
      ) {
        setCollection({
          bookmarks: stored.bookmarks,
          categories: stored.categories,
        })
      }
    } catch {
      /* Start with an empty collection if saved data is invalid. */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify(collection))
  }, [collection, ready])

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false)
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "n"
      ) {
        event.preventDefault()
        if (!showForm) {
          setEditing(null)
          setShowForm(true)
          setOpenMenu(null)
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showForm])

  const category =
    categoryParam && collection.categories.includes(categoryParam)
      ? categoryParam
      : "All bookmarks"
  const visible = collection.bookmarks.filter(
    (bookmark) => category === "All bookmarks" || bookmark.category === category
  )

  function selectCategory(name: string, replace = false) {
    setSidebarOpen(false)
    void navigate({
      search: { category: name === "All bookmarks" ? undefined : name },
      replace,
    })
  }

  function startCategoryForm(name: string) {
    setCategoryForm(name)
    setCategoryDraft(name)
    setCategoryError("")
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = categoryDraft.trim()
    if (!name) return
    const duplicate = ["All bookmarks", ...collection.categories].find(
      (item) =>
        item.toLowerCase() === name.toLowerCase() && item !== categoryForm
    )
    if (duplicate) {
      setCategoryError("That category already exists.")
      return
    }
    if (categoryForm) {
      setCollection((current) => ({
        categories: current.categories.map((item) =>
          item === categoryForm ? name : item
        ),
        bookmarks: current.bookmarks.map((bookmark) =>
          bookmark.category === categoryForm
            ? { ...bookmark, category: name }
            : bookmark
        ),
      }))
      if (categoryParam === categoryForm) selectCategory(name, true)
    } else {
      setCollection((current) => ({
        ...current,
        categories: [...current.categories, name],
      }))
      selectCategory(name)
    }
    setCategoryForm(null)
    setCategoryDraft("")
    setCategoryError("")
  }

  function deleteCategory(name: string) {
    const destination = collection.categories.find((item) => item !== name)
    if (!destination) return
    const count = collection.bookmarks.filter(
      (bookmark) => bookmark.category === name
    ).length
    if (
      count &&
      !window.confirm(
        `Delete ${name}? Its ${count} ${count === 1 ? "bookmark" : "bookmarks"} will move to ${destination}.`
      )
    )
      return
    setCollection((current) => ({
      categories: current.categories.filter((item) => item !== name),
      bookmarks: current.bookmarks.map((bookmark) =>
        bookmark.category === name
          ? { ...bookmark, category: destination }
          : bookmark
      ),
    }))
    if (categoryParam === name) selectCategory("All bookmarks", true)
  }

  function openEditor(bookmark: Bookmark | null = null) {
    setSidebarOpen(false)
    setEditing(bookmark)
    setShowForm(true)
    setOpenMenu(null)
  }

  function saveBookmark(bookmark: Bookmark) {
    setCollection((current) => ({
      ...current,
      categories: current.categories.includes(bookmark.category)
        ? current.categories
        : [...current.categories, bookmark.category],
      bookmarks: editing
        ? current.bookmarks.map((item) =>
            item.id === bookmark.id ? bookmark : item
          )
        : [bookmark, ...current.bookmarks],
    }))
    setShowForm(false)
    setEditing(null)
    if (category !== "All bookmarks" && category !== bookmark.category) {
      selectCategory(bookmark.category)
    }
  }

  function deleteBookmark(id: string) {
    setCollection((current) => ({
      ...current,
      bookmarks: current.bookmarks.filter((item) => item.id !== id),
    }))
    setOpenMenu(null)
  }

  const categoryEditor = (
    <form
      className="mt-1.5 flex flex-wrap gap-1 rounded-[10px] border border-[#dce6dc] bg-white px-1.5 py-[7px]"
      onSubmit={saveCategory}
    >
      <input
        className="w-full min-w-0 border-0 bg-transparent pl-1.5 text-xs outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
        autoFocus
        aria-label={categoryForm ? "Edit category name" : "New category name"}
        placeholder="Category name"
        value={categoryDraft}
        onChange={(event) => {
          setCategoryDraft(event.target.value)
          setCategoryError("")
        }}
        maxLength={32}
      />
      <button
        className="border-0 bg-transparent p-0.5 text-[#4b7858] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
        aria-label="Save category"
        type="submit"
      >
        <Icon icon={Add01Icon} size={16} />
      </button>
      <button
        className="border-0 bg-transparent p-0.5 text-[#4b7858] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
        aria-label="Cancel"
        type="button"
        onClick={() => setCategoryForm(null)}
      >
        <Icon icon={Cancel01Icon} size={16} />
      </button>
      {categoryError && (
        <span
          className="w-full px-1.5 py-0.5 text-[10px] text-[#af4d48]"
          role="alert"
        >
          {categoryError}
        </span>
      )}
    </form>
  )

  return (
    <div
      className="min-h-screen"
      onClick={(event) => {
        if (openMenu) setOpenMenu(null)
        if (
          sidebarOpen &&
          !(
            event.target instanceof Element &&
            event.target.closest("#category-sidebar")
          )
        ) {
          setSidebarOpen(false)
        }
      }}
    >
      <aside
        id="category-sidebar"
        className={`fixed inset-y-4 left-4 z-20 w-[264px] overflow-y-auto rounded-2xl border border-[#e9ede6] bg-[#f3f5f0] shadow-[0_12px_36px_#243d2826] transition-transform duration-300 ease-in-out motion-reduce:transition-none max-[760px]:w-[min(300px,85vw)] ${sidebarOpen ? "translate-x-0" : "-translate-x-[110%]"}`}
        aria-label="Categories"
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        <div className="px-[15px] pt-5 pb-8 max-[760px]:pt-[25px] max-[760px]:pb-[50px]">
          <div className="mb-7 flex items-center justify-between">
            <span className="text-xl font-extrabold tracking-[-0.9px] text-[#25332a]">
              Self <span className="text-[#57936a]">Shelf</span>
            </span>
            <Button
              className="size-9 text-[#44744e] hover:bg-[#eaf1e8]"
              variant="ghost"
              size="icon"
              aria-label="Close sidebar"
              aria-controls="category-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon icon={Cancel01Icon} size={20} />
            </Button>
          </div>
          <div className="mb-[14px] px-4 text-[10px] font-extrabold tracking-[1.55px] text-[#9da79b]">
            LIBRARY
          </div>
          <button
            className={`flex w-full items-center gap-[13px] rounded-[10px] border-0 px-[15px] py-3 text-left text-[13px] font-semibold transition-[background,color] duration-150 hover:bg-[#e9eee7] hover:text-[#315c3b] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] ${category === "All bookmarks" ? "bg-[#e0ebdf] font-bold text-[#356b45]" : "bg-transparent text-[#6c776d]"}`}
            onClick={() => selectCategory("All bookmarks")}
          >
            <Icon icon={Bookmark01Icon} size={18} />
            <span className="flex-1 truncate">All bookmarks</span>
            <span
              className={`ml-auto text-[11px] font-semibold max-[760px]:hidden ${category === "All bookmarks" ? "text-[#558466]" : "text-[#9ca89b]"}`}
            >
              {collection.bookmarks.length}
            </span>
          </button>
          <div className="mt-[41px] mb-[14px] px-4 text-[10px] font-extrabold tracking-[1.55px] text-[#9da79b]">
            CATEGORIES
          </div>
          {collection.categories.map((item) =>
            categoryForm === item ? (
              <div key={item}>{categoryEditor}</div>
            ) : (
              <div className="group relative" key={item}>
                <button
                  className={`flex w-full items-center gap-[13px] rounded-[10px] border-0 px-[15px] py-3 text-left text-[13px] font-semibold transition-[background,color] duration-150 hover:bg-[#e9eee7] hover:text-[#315c3b] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] max-[760px]:pr-[62px] ${category === item ? "bg-[#e0ebdf] font-bold text-[#356b45]" : "bg-transparent text-[#6c776d]"}`}
                  onClick={() => selectCategory(item)}
                >
                  <Icon icon={Folder01Icon} size={18} />
                  <span className="flex-1 truncate">{item}</span>
                  <span
                    className={`ml-auto text-[11px] font-semibold group-focus-within:opacity-0 group-hover:opacity-0 max-[760px]:hidden ${category === item ? "text-[#558466]" : "text-[#9ca89b]"}`}
                  >
                    {
                      collection.bookmarks.filter(
                        (bookmark) => bookmark.category === item
                      ).length
                    }
                  </span>
                </button>
                <div className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 gap-0.5 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 max-[760px]:pointer-events-auto max-[760px]:opacity-100">
                  <button
                    className="grid size-[23px] place-items-center rounded-[5px] border-0 bg-transparent p-0 text-[#6f8a73] hover:text-[#366b43] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
                    aria-label={`Edit ${item} category`}
                    title={`Edit ${item}`}
                    onClick={() => startCategoryForm(item)}
                  >
                    <Icon icon={Edit02Icon} size={15} />
                  </button>
                  <button
                    className="grid size-[23px] place-items-center rounded-[5px] border-0 bg-transparent p-0 text-[#6f8a73] hover:text-[#366b43] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] disabled:cursor-default disabled:opacity-35"
                    aria-label={`Delete ${item} category`}
                    title={`Delete ${item}`}
                    disabled={collection.categories.length === 1}
                    onClick={() => deleteCategory(item)}
                  >
                    <Icon icon={Delete02Icon} size={15} />
                  </button>
                </div>
              </div>
            )
          )}
          {categoryForm === "" ? (
            categoryEditor
          ) : (
            <button
              className="mt-2 flex w-full items-center gap-3 rounded-[10px] border-0 bg-transparent px-[15px] py-3 text-[13px] font-semibold text-[#72917a] hover:bg-[#e9eee7] hover:text-[#315c3b] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
              onClick={() => startCategoryForm("")}
            >
              <Icon icon={Add01Icon} size={17} /> New category
            </button>
          )}
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto max-w-[1500px] px-[60px] pt-8 pb-20 max-[1120px]:px-9 max-[1120px]:pt-7 max-[1120px]:pb-[70px] max-[760px]:px-5 max-[760px]:pt-6 max-[760px]:pb-[60px]">
          <div className="mb-7 h-9">
            {!sidebarOpen && (
              <Button
                className="size-9 border-[#e8ede6] bg-white text-[#44744e] shadow-sm hover:bg-[#eaf1e8]"
                variant="ghost"
                size="icon"
                aria-label="Open sidebar"
                aria-controls="category-sidebar"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
              >
                <Icon icon={Menu01Icon} size={21} />
              </Button>
            )}
          </div>
          <div className="flex items-end justify-between gap-5 max-[540px]:flex-col max-[540px]:items-stretch">
            <div>
              <h1 className="m-0 text-[clamp(30px,3.2vw,43px)] leading-[1.15] font-bold tracking-[-1.9px] text-[#26382b] max-[540px]:text-[32px]">
                {category}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-[7px] border border-[#e8eee6] bg-[#f4f7f1] px-[11px] py-[7px] text-[11px] font-semibold whitespace-nowrap text-[#829184] max-[540px]:hidden">
                {visible.length}{" "}
                {visible.length === 1 ? "bookmark" : "bookmarks"}
              </span>
              <button
                className="inline-flex min-h-[42px] items-center justify-center gap-[9px] rounded-[9px] border border-[#3e7950] bg-[#3e7950] px-[17px] text-xs font-bold whitespace-nowrap text-white shadow-[0_4px_9px_#2d69391a] transition-[background,transform] duration-150 hover:-translate-y-px hover:bg-[#326440] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
                onClick={() => openEditor()}
              >
                Add bookmark{" "}
                <kbd className="rounded border border-[#ffffff66] px-1.5 py-[3px] text-[10px] font-semibold">
                  {isMac ? "⌘ N" : "Ctrl N"}
                </kbd>
              </button>
            </div>
          </div>

          <div className="mt-7 mb-6 flex items-center justify-end gap-[15px] max-[760px]:mt-[29px]">
            <div
              className="flex items-center gap-0.5 rounded-[9px] border border-[#e7ece5] bg-white p-1"
              role="group"
              aria-label="Bookmark view"
            >
              <button
                className="grid size-[33px] place-items-center rounded-[6px] border-0 bg-transparent text-[#9ba79b] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] aria-pressed:bg-[#e6efe5] aria-pressed:text-[#3e7950]"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <Icon icon={GridViewIcon} size={19} />
              </button>
              <button
                className="grid size-[33px] place-items-center rounded-[6px] border-0 bg-transparent text-[#9ba79b] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] aria-pressed:bg-[#e6efe5] aria-pressed:text-[#3e7950]"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <Icon icon={ListViewIcon} size={19} />
              </button>
            </div>
          </div>

          {!ready ? null : visible.length ? (
            <div
              className={`grid ${view === "list" ? "grid-cols-1 gap-[13px]" : "grid-cols-3 gap-[21px] max-[1120px]:grid-cols-2 max-[760px]:grid-cols-2 max-[540px]:grid-cols-1"}`}
            >
              {visible.map((bookmark) => (
                <article
                  className={`group relative min-w-0 rounded-xl border border-[#e8ede6] bg-white shadow-[0_4px_18px_#243d2808] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_26px_#243d2814] ${view === "list" ? "min-h-[132px]" : ""}`}
                  key={bookmark.id}
                >
                  <a
                    className={`group/link flex h-full overflow-hidden rounded-[inherit] text-inherit no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] ${view === "list" ? "flex-row" : "flex-col"}`}
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${bookmark.title} in a new tab`}
                  >
                    <div
                      className={`relative flex h-[175px] items-center justify-center overflow-hidden rounded-[11px_11px_0_0] bg-[radial-gradient(circle_at_27%_35%,#e0eadd_0_9%,transparent_9.4%),radial-gradient(circle_at_71%_71%,#dce8d9_0_14%,transparent_14.4%),linear-gradient(135deg,#e7eee1,#cadbc9)] text-[#7d9c83] before:absolute before:inset-0 before:bg-[linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] before:bg-size-[27px_27px] before:opacity-[0.23] before:content-[''] ${view === "list" ? "h-auto min-h-[132px] w-[205px] min-w-[205px] rounded-[11px_0_0_11px] max-[540px]:h-auto max-[540px]:w-[108px] max-[540px]:min-w-[108px]" : "max-[540px]:h-[190px]"}`}
                    >
                      <Icon icon={Image01Icon} size={35} />
                      {bookmark.image && (
                        <img
                          className="absolute z-[1] size-full object-cover"
                          src={bookmark.image}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none"
                          }}
                        />
                      )}
                      <span className="absolute top-[13px] right-[13px] z-[2] grid size-[31px] translate-y-[3px] place-items-center rounded-lg bg-[#ffffffeb] text-[#3c6950] opacity-0 transition-[opacity,transform] duration-150 group-hover/link:translate-y-0 group-hover/link:opacity-100 group-focus-visible/link:translate-y-0 group-focus-visible/link:opacity-100">
                        <Icon icon={ArrowUpRight01Icon} size={18} />
                      </span>
                    </div>
                    <div
                      className={`flex min-h-[180px] flex-1 flex-col p-[19px_20px_18px] ${view === "list" ? "min-h-[132px] px-5 pt-[17px] pr-[50px] pb-[15px] max-[540px]:px-[13px] max-[540px]:pt-[14px] max-[540px]:pr-10 max-[540px]:pb-[14px]" : ""}`}
                    >
                      <span className="self-start rounded-[5px] bg-[#ebf3e9] px-2 py-1 text-[10px] font-bold text-[#4d8058]">
                        {bookmark.category}
                      </span>
                      <h2
                        className={`mt-3 mr-[25px] mb-1.5 [display:-webkit-box] overflow-hidden text-[16px] leading-[1.36] font-bold tracking-[-0.35px] text-ellipsis text-[#2b382d] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] ${view === "list" ? "mt-[7px] mb-[3px] max-[540px]:text-[13px]" : ""}`}
                      >
                        {bookmark.title}
                      </h2>
                      <p
                        className={`mb-[18px] [display:-webkit-box] overflow-hidden text-xs leading-[1.55] text-ellipsis text-[#8b968c] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] ${view === "list" ? "mb-2 [-webkit-line-clamp:1] max-[540px]:hidden" : ""}`}
                      >
                        {bookmark.description || "No description added."}
                      </p>
                      <span className="mt-auto flex min-w-0 items-center gap-[5px] overflow-hidden text-[10px] font-semibold text-ellipsis whitespace-nowrap text-[#9aa69a]">
                        <Icon icon={Link01Icon} size={15} />{" "}
                        {new URL(bookmark.url).hostname.replace(/^www\./, "")}
                      </span>
                    </div>
                  </a>
                  <div
                    className={`absolute top-[185px] right-[13px] z-[5] ${view === "list" ? "top-[18px] max-[540px]:top-[15px] max-[540px]:right-2" : ""}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      className="grid size-[29px] place-items-center rounded-[7px] border-0 bg-transparent text-[#93a094] hover:bg-[#eef3ed] hover:text-[#427750] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] aria-expanded:bg-[#eef3ed] aria-expanded:text-[#427750]"
                      aria-label={`Actions for ${bookmark.title}`}
                      aria-expanded={openMenu === bookmark.id}
                      onClick={() =>
                        setOpenMenu(
                          openMenu === bookmark.id ? null : bookmark.id
                        )
                      }
                    >
                      <Icon icon={MoreHorizontalIcon} size={20} />
                    </button>
                    {openMenu === bookmark.id && (
                      <div className="absolute top-8 right-0 w-[130px] rounded-[9px] border border-[#e4eae2] bg-white p-[5px] shadow-[0_10px_24px_#1e352329]">
                        <button
                          className="flex w-full items-center gap-[10px] rounded-md border-0 bg-transparent p-[9px] text-left text-xs text-[#566358] hover:bg-[#f3f6f1] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
                          onClick={() => openEditor(bookmark)}
                        >
                          <Icon icon={Edit02Icon} size={16} /> Edit
                        </button>
                        <button
                          className="flex w-full items-center gap-[10px] rounded-md border-0 bg-transparent p-[9px] text-left text-xs text-[#ba6660] hover:bg-[#fbf1f0] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
                          onClick={() => deleteBookmark(bookmark.id)}
                        >
                          <Icon icon={Delete02Icon} size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#dce6d9] bg-white px-5 py-10 text-center max-[540px]:min-h-[390px]">
              <div className="relative mb-[14px] size-[125px]">
                <div className="absolute top-[19px] left-[18px] size-[72px] rotate-[-13deg] rounded-[9px] border border-[#dbe8da] bg-[#e7f0e5]" />
                <div className="absolute top-4 left-[26px] grid size-[72px] rotate-[8deg] place-items-center rounded-[9px] border border-[#dbe8da] bg-[#f1f7ee] text-[#6d9a73] shadow-[0_8px_17px_#476c4d16]">
                  <Icon icon={Bookmark01Icon} size={34} />
                </div>
                <span className="absolute top-[10px] right-[3px] text-[18px] text-[#a1c59f]">
                  ✦
                </span>
                <span className="absolute bottom-[5px] left-[5px] text-xs text-[#a1c59f]">
                  ✦
                </span>
              </div>
              <h2 className="mb-2 text-[21px] tracking-[-0.55px] text-[#2b3c2e]">
                {category === "All bookmarks"
                  ? "Your collection starts here"
                  : `Nothing in ${category} yet`}
              </h2>
              <p className="mb-[22px] max-w-[300px] text-xs leading-[1.6] text-[#929f92]">
                Found something worth keeping? Save it here and come back
                whenever you like.
              </p>
              <button
                className="inline-flex min-h-[42px] items-center justify-center gap-[9px] rounded-[9px] border border-[#3e7950] bg-[#3e7950] px-[17px] text-xs font-bold whitespace-nowrap text-white shadow-[0_4px_9px_#2d69391a] transition-[background,transform] duration-150 hover:-translate-y-px hover:bg-[#326440] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
                onClick={() => openEditor()}
              >
                <Icon icon={Add01Icon} size={19} /> Add your first bookmark
              </button>
            </div>
          )}
        </div>
      </main>
      {showForm && (
        <BookmarkForm
          bookmark={editing}
          categories={collection.categories}
          defaultCategory={
            category === "All bookmarks" ? collection.categories[0] : category
          }
          onClose={() => setShowForm(false)}
          onSave={saveBookmark}
        />
      )}
    </div>
  )
}

function BookmarkForm({
  bookmark,
  categories,
  defaultCategory,
  onClose,
  onSave,
}: {
  bookmark: Bookmark | null
  categories: string[]
  defaultCategory: string
  onClose: () => void
  onSave: (bookmark: Bookmark) => void
}) {
  const [url, setUrl] = useState(bookmark?.url ?? "")
  const [title, setTitle] = useState(bookmark?.title ?? "")
  const [description, setDescription] = useState(bookmark?.description ?? "")
  const [category, setCategory] = useState(
    bookmark?.category ?? defaultCategory
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const normalizedCategory = category.trim()
  const existingCategory = categories.find(
    (item) => item.toLowerCase() === normalizedCategory.toLowerCase()
  )
  const categoryOptions =
    normalizedCategory &&
    normalizedCategory.toLowerCase() !== "all bookmarks" &&
    !existingCategory
      ? [...categories, normalizedCategory]
      : categories

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let normalized: URL
    try {
      normalized = new URL(url.trim())
      if (!["http:", "https:"].includes(normalized.protocol)) throw new Error()
    } catch {
      setError("Enter a valid http or https link.")
      return
    }

    const categoryName = category.trim()
    if (!categoryName || categoryName.toLowerCase() === "all bookmarks") {
      setError("Choose a category.")
      return
    }
    setSaving(true)
    setError("")
    let metadata = { title: "", description: "", image: "" }
    try {
      metadata = await getMetadata({ data: normalized.href })
    } catch {
      /* The link can still be saved without a preview. */
    }
    onSave({
      id: bookmark?.id ?? crypto.randomUUID(),
      url: normalized.href,
      title:
        title.trim() ||
        metadata.title ||
        normalized.hostname.replace(/^www\./, ""),
      description: description.trim() || metadata.description,
      image:
        metadata.image ||
        (bookmark?.url === normalized.href ? bookmark.image : ""),
      category: existingCategory ?? categoryName,
    })
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#1f2a21a8] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[min(92vh,800px)] w-full max-w-[495px] overflow-y-auto rounded-2xl bg-white p-[29px] shadow-[0_20px_70px_#14241940] max-[540px]:p-[22px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
      >
        <div className="mb-6 flex justify-between gap-[18px]">
          <div>
            <span className="flex items-center gap-[10px] text-[10px] font-extrabold tracking-[1.65px] text-[#6c9b74]">
              YOUR COLLECTION
            </span>
            <h2
              className="mt-2 mb-[3px] text-[27px] tracking-[-0.8px] text-[#28392d]"
              id="form-title"
            >
              {bookmark ? "Edit bookmark" : "Add a bookmark"}
            </h2>
            <p className="m-0 text-xs text-[#91a092]">
              Keep a good link close by.
            </p>
          </div>
          <button
            className="grid size-8 shrink-0 place-items-center self-start rounded-lg border-0 bg-[#f3f6f2] text-[#829084] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon icon={Cancel01Icon} size={21} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label className="mb-4 block">
            <span className="mb-[7px] block text-xs font-bold text-[#3d4c3f]">
              Website link <em className="text-[#bd6d64] not-italic">*</em>
            </span>
            <input
              className="w-full rounded-lg border border-[#e0e8df] bg-white px-3 py-[11px] text-xs text-[#354437] outline-none placeholder:text-[#abb6ab] focus:border-[#8cb596] focus:shadow-[0_0_0_3px_#c9dfcc55] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
              autoFocus
              type="url"
              required
              placeholder="https://example.com/article"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-[7px] block text-xs font-bold text-[#3d4c3f]">
              Title{" "}
              <small className="ml-1 text-[10px] font-medium text-[#a0aaa0]">
                optional
              </small>
            </span>
            <input
              className="w-full rounded-lg border border-[#e0e8df] bg-white px-3 py-[11px] text-xs text-[#354437] outline-none placeholder:text-[#abb6ab] focus:border-[#8cb596] focus:shadow-[0_0_0_3px_#c9dfcc55] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
              placeholder="We’ll pull this from the website"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-[7px] block text-xs font-bold text-[#3d4c3f]">
              Description{" "}
              <small className="ml-1 text-[10px] font-medium text-[#a0aaa0]">
                optional
              </small>
            </span>
            <textarea
              className="min-h-[83px] w-full resize-y rounded-lg border border-[#e0e8df] bg-white px-3 py-[11px] text-xs text-[#354437] outline-none placeholder:text-[#abb6ab] focus:border-[#8cb596] focus:shadow-[0_0_0_3px_#c9dfcc55] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
              placeholder="A quick note about why you saved this..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={500}
            />
          </label>
          <div className="mb-4">
            <label
              htmlFor="bookmark-category"
              className="mb-[7px] block text-xs font-bold text-[#3d4c3f]"
            >
              Category
            </label>
            <Combobox
              value={category}
              inputValue={category}
              items={categoryOptions}
              onInputValueChange={setCategory}
              onValueChange={(value) => setCategory(value ?? "")}
            >
              <ComboboxInput
                id="bookmark-category"
                placeholder="Choose or create a category"
                className="w-full rounded-lg border-[#e0e8df] bg-white shadow-none focus-within:border-[#8cb596] focus-within:shadow-[0_0_0_3px_#c9dfcc55] focus-within:ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-[#8cb596] has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot=input-group-control]:focus-visible]:shadow-[0_0_0_3px_#c9dfcc55] [&_[data-slot=input-group-control]]:h-auto [&_[data-slot=input-group-control]]:py-[11px] [&_[data-slot=input-group-control]]:text-xs [&_[data-slot=input-group-control]]:text-[#354437] [&_[data-slot=input-group-control]]:placeholder:text-[#abb6ab] [&_[data-slot=input-group-control]]:focus-visible:outline-3 [&_[data-slot=input-group-control]]:focus-visible:outline-offset-2 [&_[data-slot=input-group-control]]:focus-visible:outline-[#a6c8a6] [&_[data-slot=input-group-control]]:focus-visible:ring-0 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[#a6c8a6] [&_button:focus-visible]:ring-0 [&_[data-slot=combobox-trigger]]:text-[#7e927f]"
              />
              <ComboboxContent className="border border-[#e0e8df] bg-white text-[#354437] shadow-[0_10px_24px_#243d281a]">
                <ComboboxEmpty className="px-3 text-xs">
                  No matching categories.
                </ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem
                      key={item}
                      value={item}
                      className="py-2 text-xs text-[#354437] data-highlighted:bg-[#f0f5ee] data-highlighted:text-[#315c3b]"
                    >
                      {categories.includes(item) ? (
                        item
                      ) : (
                        <span className="flex items-center gap-2">
                          <Icon icon={Add01Icon} size={14} />
                          Create “{item}”
                        </span>
                      )}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <p className="text-[11px] leading-[1.5] text-[#9aa79a]">
            Leave title and description empty to use the website’s details when
            available.
          </p>
          {error && (
            <p className="text-xs text-[#af4d48]" role="alert">
              {error}
            </p>
          )}
          <div className="mt-[25px] flex justify-end gap-[9px]">
            <button
              className="min-h-[42px] rounded-[9px] border border-[#e1e7de] bg-white px-[19px] text-xs font-bold text-[#536154] hover:bg-[#f6f8f4] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6]"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="inline-flex min-h-[42px] items-center justify-center gap-[9px] rounded-[9px] border border-[#3e7950] bg-[#3e7950] px-[17px] text-xs font-bold whitespace-nowrap text-white shadow-[0_4px_9px_#2d69391a] transition-[background,transform] duration-150 hover:-translate-y-px hover:bg-[#326440] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a6c8a6] disabled:cursor-wait disabled:opacity-70"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : bookmark
                  ? "Save changes"
                  : "Save bookmark"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

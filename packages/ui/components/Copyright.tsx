export default function Copyright(){
    return (
        <div className="border-t border-zinc-200 dark:border-white/10 px-8 py-6 text-center text-xs text-zinc-500 dark:text-gray-500">
            © {new Date().getFullYear()} Prismio Contributors. Released under Apache-2.0.
        </div>
    )
}
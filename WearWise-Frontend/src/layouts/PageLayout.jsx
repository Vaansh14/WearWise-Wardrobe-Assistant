export default function PageLayout({ title, children }) {
    return (
        <div className="max-w-7xl mx-auto px-6 py-10">

            <h1 className="text-3xl font-semibold mb-8 tracking-tight">
                {title}
            </h1>

            {children}

        </div>
    );
}
import React from 'react'
// import GalaxyCanvas from "../components/GalaxyCanvas";

const page = () => {
    return (
        <main className="relative min-h-screen overflow-hidden">
        {/* <GalaxyCanvas /> */}
        <section className="absolute right-10 top-1/2 text-right -translate-y-1/2">
            <h1 className="text-5xl font-bold text-blue-300">Welcome to My Galaxy</h1>
            <p className="mt-4 text-gray-300 text-lg max-w-md">
                Explore the stars — each one is a project, a story, or an idea waiting to shine.
            </p>
        </section>
//         </main>
    );
}

export default page

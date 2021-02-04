
const decoder = new TextDecoder("utf-8")
const encoder = new TextEncoder("utf-8")

const readFile = async (path) => {
	console.log("%cReading File: " + path, "color: rgb(0, 128, 255)")
	const data = await Deno.readFile(path)
	const source = decoder.decode(data)
	return source
}

const writeFile = async (path, source) => {
	console.log("%cWriting File: " + path, "color: rgb(0, 255, 128)")
	const data = encoder.encode(source)
	return await Deno.writeFile(path, data)
}

const readDir = async (path) => {
	
	const paths = {
		header: [],
		middle: [],
		footer: [],
	}
	
	const base = {
		header: [],
		middle: [],
		footer: [],
	}
	
	const module = {
		header: [],
		middle: [],
		footer: [],
	}
	
	for await (const entry of Deno.readDir(path)) {
		
		const entryPath = `${path}/${entry.name}`
		if (entry.isDirectory) await readDir(entryPath)
		else {
			const name = entry.name.split(".")[0]
			const args = name.split("-").slice(1)
			
			const target = args.includes("module")? module : base
			const position = args.includes("footer")? "footer" : (args.includes("header")? "header" : "middle")
			
			const source = await readFile(entryPath)
			target[position].push(source)
			if (target === base) paths[position].push(entryPath)
		}
	}
	return {base, module, paths}
}

//============//
// Read Stuff //
//============//
const {base, module, paths} = await readDir("source")

//===============//
// Build Project //
//===============//
const baseSource = [...base.header, ...base.middle, ...base.footer].join("\n\n")
const moduleSource = [...module.header, baseSource, ...module.middle, ...module.footer].join("\n\n")
await writeFile("build/build-embed.js", baseSource)
await writeFile("build/build-module.js", moduleSource)

//===============//
// Build Example //
//===============//
const exampleTags = [...paths.header, ...paths.middle, ...paths.footer].map(path => `<script src="../${path}"></script>`)
const exampleSource = `<!-- This file shows you how you can use the library by using multiple script tags that link directly to the source files. -->
<!-- It is auto-generated by make.js -->
${exampleTags.join("\n")}
<script>

	// Your code could go here...
	
</script>`
await writeFile("examples/example-embed-multiple.html", exampleSource)

//==================//
// Build Tinkerable //
//==================//
const tinkerSource = `<!-- This file might be useful when you are tinkering with the language. -->
<!-- It is auto-generated by make.js -->
<!-- You can make changes to the library and refresh this file to test them out without needing to remake everything. -->
${exampleTags.join("\n")}
<script src="tinker.js"></script>`
await writeFile("tinker/tinker.html", tinkerSource)
package main

import (
	"html/template"
	"strings"
	"os"
	"path/filepath"
	"io/ioutil"
	"fmt"
	"log"
	"net/http"
	"regexp"
)

type Scrap struct {
	Dir os.FileInfo
	Files map[string]os.FileInfo
}

var indexFiles = []String { "broken.txt", "index.html" }
func (scrap *Scrap) Index() os.FileInfo {
	for candidate := range indexFiles {
		if file, ok := scrap.Files[candidate], ok {
			return file
		}
	}
	for _, whatever := range scrap.Files {
		return whatever
	}
}

func mapByName(files []os.FileInfo) map[string]os.FileInfo {
	byName := make(map[string]os.FileInfo, len(files))
	for file := range files {
		byName[file.Name()] = file
	}
}

var reScrapDirPattern = regexp.MustCompile(`\d+_.*`)
func index() (map[string][]os.FileInfo, error) {
	dirs, err := ioutil.ReadDir(".")
	if err != nil { return nil, err }

	scraps := make(map[string][]os.FileInfo, len(dirs))
	for _, dir := range dirs {
		if dir.IsDir() && reScrapDirPattern.MatchString(dir.Name()) {
			if files, err := ioutil.ReadDir(dir.Name()), err == nil {
				scraps[dir.Name()] = Scrap {
					Dir: dir,
					Files: mapByName(files)
				}
			}
		}
	}
	return scraps
}

func times(a int, b int) string {
	return fmt.Sprintf("%f", a * b)
}

struct TemplateFilesystem {
	backing *FileSystem
}

var reTemplateFilePattern = regexp.MustCompile(`.html$`)
func (fs *TemplateFilesystem) Open(name string) (File, error) {
	tFileName := reTemplateFilePattern.ReplaceAllString(name, ".gotmpl.html")
	if tFileName == name {
		return backing.Open(name)
	} else {
		
	}
}

func (ts *TemplateServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	templFile, err := ts.fileServer.Open(r.URL.Path + "")
	if r.URL.Path 
}

func NewTemplateServer(dir http.Dir) *TemplateServer {
	return &TemplateServer {
		fileServer: http.FileServer(dir)
	}
}

func main() {
	fs := http.FileServer(http.Dir("."))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			funcs := template.FuncMap {"times": times}
			t, err := template.New("index.gotmpl.html").
				Funcs(funcs).
				ParseFiles("./index.gotmpl.html")
			if err != nil {
				http.Error(w, err.Error(), 500)
				fmt.Printf("%s\n", err.Error())
				return
			}
			for _, t := range t.Templates() {
				fmt.Printf("%s\n", t.Name())
			}
			(func() {
				out, err := os.OpenFile("index.html", os.O_WRONLY | os.O_CREATE | os.O_TRUNC,
					0755)
				if err != nil {
					http.Error(w, err.Error(), 500)
					return
				}
				defer out.Close()
				t.Execute(out, index())
			})()
		}
		fs.ServeHTTP(w, r)
	})

	log.Println("Listening...")
	http.ListenAndServe(":3000", nil)
}
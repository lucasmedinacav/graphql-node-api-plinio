const gulp = require('gulp');
const clean = require('gulp-clean');
const ts = require('gulp-typescript');

//Obtem as configuracoes de transpilação (só executa depois de finalizar a static)
const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', ['static'], () => {
    //Transpila o ts para js
    const tsResult = tsProject.src()
        .pipe(tsProject());
    //Joga o resultado na pasta dist
    tsResult.js
        .pipe(gulp.dest('dist'));
});

//SERVE PARA COLOCAR OS ARQUIVOS ESTATICOS DO SRC PARA O DIST (só executa depois de finalizar a clean)
gulp.task('static', ['clean'], () => {
    return gulp
        .src(['src/**/*.json'])
        .pipe(gulp.dest('dist'));
});

//LIMPA DO DIST OS ARQUIVOS DELETADOS DO SRC
gulp.task('clean', () => {
    return gulp
        .src('dist')
        .pipe(clean());

});



//FICA OUVINDO ALTERAÇÕES NOS ARQUIVOS .ts dentro do src e executa o build
gulp.task('watch', ['scripts'], () => {
    return gulp.watch(['src/**/*.ts', 'src/**/*.json'], ['scripts']);
});

gulp.task('default', ['watch']);
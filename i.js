console.log('hi')
setTimeout(()=>{
    console.log('hello')
},5000)
var i=2;
if(i==3){
    var s=setTimeout(()=>{
        console.log('hello')
        // console.log(s)
    },3000)
    console.log(s)
}else if(i==2){
    var s=setTimeout(()=>{
        console.log('hello')
        console.log(s)
    },5000)
    // console.log(s)
}else{
    var s=setTimeout(()=>{
        console.log('hello')
        console.log(s)
    },5000)
}
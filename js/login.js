function checkForm(){
    var pwds=new Array('1234', '5678', 'abcd', 'efgh');
    var account= document.getElementById('inputEmail');
    var pwd = document.getElementById('inputPassword');
    console.log("account:"+account.value+"pwd:"+pwd.value);

    if(account.value == 'admin'){
        console.log("account right!");
        for(index in pwds){
            if(pwds[index] == pwd.value){
                console.log("pwd right!");
                return true;
            }
        }
    }
    return false;
}
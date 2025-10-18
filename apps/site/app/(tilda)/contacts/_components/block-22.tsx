export function ContactsBlock22() {
  return (
    <div 
      id="rec1125387881" 
      data-record-type="131"
      dangerouslySetInnerHTML={{ __html: `<div id="rec1125387881" class="r t-rec" style=" " data-animationappear="off" data-record-type="131">  <div class="t123"> <div class="t-container_100 "> <div class="t-width t-width_100 ">  <script>
// Переопределяем функцию успешной отправки формы Zero Block
function t396_onSuccess(form) {
    // Проверяем наличие формы
    if (!form) return;
    
    // Преобразуем jQuery объект в обычный DOM элемент
    if (form instanceof jQuery) {
        form = form.get(0);
    }
    
    // Получаем URL для перенаправления из атрибута формы
    var successUrl = form.getAttribute('data-success-url');
    
    // Если URL задан - открываем его в новой вкладке
    if (successUrl) {
        // Открываем страницу в новой вкладке и переключаемся
        window.open(successUrl, '_blank').focus();
        
        // Блокируем стандартное перенаправление в той же вкладке
        return false;
    }
}
</script>  </div> </div> </div> </div>` }}
    />
  );
}
import { useTranslation } from "next-i18next";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;
  const { data: infoData, error: infoError } = useWidgetAPI(widget, "system_info");
  const { data: storageData, error: storageError } = useWidgetAPI(widget, "system_storage");
  const { data: utilizationData, error: utilizationError } = useWidgetAPI(widget, "utilization");

  if (storageError || infoError || utilizationError) {
    return <Container service={service} error={storageError ?? infoError ?? utilizationError} />;
  }

  if (!widget.fields) {
    widget.fields = ["uptime", "volumeAvailable", "resources.cpu", "resources.mem"];
  }

  if (!storageData || !infoData || !utilizationData) {
    return (
      <Container service={service}>
        <Block label="diskstation.uptime" />
        <Block label="diskstation.volumeAvailable" />
        <Block label="diskstation.volumeTotal" />
        <Block label="diskstation.volumeUsed" />
        <Block label="resources.cpu" />
        <Block label="resources.mem" />
      </Container>
    );
  }

  // uptime info
  // eslint-disable-next-line no-unused-vars
  const [hour, minutes, seconds] = infoData.data.up_time.split(":");
  const days = Math.floor(hour / 24);
  const uptime = `${t("common.number", { value: days })} ${t("diskstation.days")}`;

  let usedBytes = 0;
  let totalBytes = 0;
  let freeBytes = 0;
  if(widget.volume){
    const volume = storageData.data.vol_info?.find((vol) => vol.name === widget.volume)
    usedBytes = parseFloat(volume?.used_size);
    totalBytes = parseFloat(volume?.total_size);
    freeBytes = totalBytes - usedBytes;
  }else{
    storageData.data.vol_info?.forEach((vol)=>{
      usedBytes += parseFloat(vol.used_size);
      totalBytes += parseFloat(vol.total_size);
      freeBytes += totalBytes - usedBytes;
    })
  }

  // utilization info
  const { cpu, memory } = utilizationData.data;
  const cpuLoad = parseFloat(cpu.user_load) + parseFloat(cpu.system_load);
  const memoryUsage =
    100 - (100 * (parseFloat(memory.avail_real) + parseFloat(memory.cached))) / parseFloat(memory.total_real);

  return (
    <Container service={service}>
      <Block label="diskstation.uptime" value={uptime} />
      <Block
        label="diskstation.volumeAvailable"
        value={t("common.bbytes", { value: freeBytes, maximumFractionDigits: 1 })}
      />
      <Block
        label="diskstation.volumeTotal"
        value={t("common.bbytes", { value: totalBytes, maximumFractionDigits: 1 })}
      />
      <Block
        label="diskstation.volumeUsed"
        value={t("common.bbytes", { value: usedBytes, maximumFractionDigits: 1 })}
      />
      <Block label="resources.cpu" value={t("common.percent", { value: cpuLoad })} />
      <Block label="resources.mem" value={t("common.percent", { value: memoryUsage })} />
    </Container>
  );
}
